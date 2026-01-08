import { Node, Edge } from '@xyflow/react'
import type { TopologicalSortResult } from '../types/execution'

/**
 * Performs topological sort on workflow graph using DFS
 * Returns sorted nodes and cycle detection
 */
export function topologicalSort(nodes: Node[], edges: Edge[]): TopologicalSortResult {
  const visited = new Set<string>()
  const recursionStack = new Set<string>()
  const sorted: Node[] = []
  let hasCycle = false
  const cycleNodes: string[] = []

  // Build adjacency list
  const adjacencyList = new Map<string, string[]>()
  nodes.forEach(node => adjacencyList.set(node.id, []))
  edges.forEach(edge => {
    const targets = adjacencyList.get(edge.source) || []
    targets.push(edge.target)
    adjacencyList.set(edge.source, targets)
  })

  function dfs(nodeId: string): void {
    if (recursionStack.has(nodeId)) {
      hasCycle = true
      cycleNodes.push(nodeId)
      return
    }

    if (visited.has(nodeId)) {
      return
    }

    visited.add(nodeId)
    recursionStack.add(nodeId)

    const neighbors = adjacencyList.get(nodeId) || []
    neighbors.forEach(neighborId => dfs(neighborId))

    recursionStack.delete(nodeId)

    const node = nodes.find(n => n.id === nodeId)
    if (node) {
      sorted.unshift(node)  // Add to beginning (reverse postorder)
    }
  }

  // Start DFS from nodes with no incoming edges (entry points)
  const nodesWithIncoming = new Set(edges.map(e => e.target))
  const entryNodes = nodes.filter(n => !nodesWithIncoming.has(n.id))

  if (entryNodes.length === 0 && nodes.length > 0) {
    // No entry points - start from first node
    dfs(nodes[0].id)
  } else {
    entryNodes.forEach(node => dfs(node.id))
  }

  // Visit remaining unvisited nodes
  nodes.forEach(node => {
    if (!visited.has(node.id)) {
      dfs(node.id)
    }
  })

  return {
    sorted,
    hasCycle,
    cycleNodes: hasCycle ? Array.from(new Set(cycleNodes)) : undefined
  }
}

/**
 * Gets inputs for a node based on its incoming edges
 * Sorts inputs by source node X position (left-to-right)
 */
export function getNodeInputs(
  nodeId: string,
  edges: Edge[],
  results: Map<string, any>,
  nodes?: Node[]
): Record<string, any> {
  const incomingEdges = edges.filter(e => e.target === nodeId)

  // Sort by source node X position if nodes array provided
  if (nodes) {
    const nodePositions = new Map(nodes.map(n => [n.id, n.position.x]))
    incomingEdges.sort((a, b) => {
      const posA = nodePositions.get(a.source) || 0
      const posB = nodePositions.get(b.source) || 0
      return posA - posB
    })
  }

  const inputs: Record<string, any> = {}
  incomingEdges.forEach((edge, index) => {
    const key = `input${index + 1}`
    inputs[key] = results.get(edge.source)
  })

  return inputs
}
