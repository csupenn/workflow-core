import type { Node, Edge } from "@xyflow/react"
import type { ValidationIssue } from "../types/validation"

const BLOCKED_HOSTS = [
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "169.254.169.254", // AWS metadata
  "metadata.google.internal", // GCP metadata
  "10.",
  "172.16.",
  "192.168.",
]

export function isUrlSafe(url: string): boolean {
  try {
    const parsed = new URL(url)

    // Block private IP ranges and localhost
    const hostname = parsed.hostname.toLowerCase()

    for (const blocked of BLOCKED_HOSTS) {
      if (hostname === blocked || hostname.startsWith(blocked)) {
        return false
      }
    }

    // Only allow HTTP/HTTPS protocols
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return false
    }

    return true
  } catch {
    return false
  }
}

export function detectCycles(nodes: Node[], edges: Edge[]): string[][] {
  const graph = new Map<string, string[]>()

  // Build adjacency list
  nodes.forEach((node) => graph.set(node.id, []))
  edges.forEach((edge) => {
    const neighbors = graph.get(edge.source) || []
    neighbors.push(edge.target)
    graph.set(edge.source, neighbors)
  })

  const cycles: string[][] = []
  const visited = new Set<string>()
  const recStack = new Set<string>()
  const currentPath: string[] = []

  function dfs(nodeId: string): boolean {
    visited.add(nodeId)
    recStack.add(nodeId)
    currentPath.push(nodeId)

    const neighbors = graph.get(nodeId) || []
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true
      } else if (recStack.has(neighbor)) {
        // Found a cycle
        const cycleStart = currentPath.indexOf(neighbor)
        const cycle = currentPath.slice(cycleStart)
        cycles.push([...cycle, neighbor])
        return true
      }
    }

    recStack.delete(nodeId)
    currentPath.pop()
    return false
  }

  // Check all nodes for cycles
  for (const node of nodes) {
    if (!visited.has(node.id)) {
      dfs(node.id)
    }
  }

  return cycles
}

export function validateWorkflow(nodes: Node[], edges: Edge[]): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  // Check for cycles
  const cycles = detectCycles(nodes, edges)
  if (cycles.length > 0) {
    cycles.forEach((cycle) => {
      issues.push({
        type: "error",
        nodeId: cycle[0],
        message: `Cycle detected - Infinite loop found involving nodes: ${cycle.join(' → ')}`,
        suggestion: "Remove connections that create circular dependencies"
      })
    })
  }

  // Check for orphan nodes
  const connectedNodes = new Set<string>()
  edges.forEach((edge) => {
    connectedNodes.add(edge.source)
    connectedNodes.add(edge.target)
  })

  const orphanNodes = nodes.filter((node) => !connectedNodes.has(node.id) && node.type !== "start" && nodes.length > 1)

  if (orphanNodes.length > 0) {
    orphanNodes.forEach((node) => {
      issues.push({
        type: "warning",
        nodeId: node.id,
        message: "Orphan node - Not connected to workflow and will not execute",
        suggestion: "Connect this node to the workflow or remove it"
      })
    })
  }

  // Check for start node
  const hasStartNode = nodes.some((node) => node.type === "start")
  if (!hasStartNode && nodes.length > 0) {
    issues.push({
      type: "warning",
      message: "No Start node - Workflow needs an entry point",
      suggestion: "Add a Start node to define where execution begins"
    })
  }

  // Check for unreachable end nodes
  const endNodes = nodes.filter((node) => node.type === "end")
  endNodes.forEach((endNode) => {
    const hasPath = edges.some((edge) => edge.target === endNode.id)
    if (!hasPath && nodes.length > 1) {
      issues.push({
        type: "warning",
        nodeId: endNode.id,
        message: "Unreachable End node - Cannot be reached from any other node",
        suggestion: "Connect this node to the workflow or remove it"
      })
    }
  })

  // Check for missing configurations
  nodes.forEach((node) => {
    const data = node.data as any
    switch (node.type) {
      case "textModel":
        if (!data.model) {
          issues.push({
            type: "error",
            nodeId: node.id,
            field: "model",
            message: "Text Model node requires a model to be selected",
            suggestion: "Select an AI model from the configuration panel"
          })
        }
        break

      case "httpRequest":
        if (!data.url) {
          issues.push({
            type: "error",
            nodeId: node.id,
            field: "url",
            message: "HTTP Request node requires a URL",
            suggestion: "Enter a valid HTTP or HTTPS URL"
          })
        } else if (!isUrlSafe(data.url)) {
          issues.push({
            type: "error",
            nodeId: node.id,
            field: "url",
            message: "Unsafe URL - Points to private network or uses unsupported protocol",
            suggestion: "Only public HTTP/HTTPS endpoints are allowed. Avoid localhost, private IPs, and metadata endpoints"
          })
        }
        break

      case "prompt":
        if (!data.content) {
          issues.push({
            type: "warning",
            nodeId: node.id,
            field: "content",
            message: "Prompt node has no content",
            suggestion: "Add prompt text or template"
          })
        }
        break

      case "conditional":
        if (!data.condition) {
          issues.push({
            type: "error",
            nodeId: node.id,
            field: "condition",
            message: "Conditional node requires a condition expression",
            suggestion: "Add a JavaScript expression that returns true or false"
          })
        }
        break
    }
  })

  // Check for unused outputs
  const targetNodes = new Set(edges.map((e) => e.target))
  const unusedOutputs = nodes.filter((node) => !targetNodes.has(node.id) && node.type !== "end" && nodes.length > 1)

  if (unusedOutputs.length > 0) {
    unusedOutputs.forEach((node) => {
      issues.push({
        type: "info",
        nodeId: node.id,
        message: "Node output not connected - Result will not be used",
        suggestion: "Connect to another node or add an End node"
      })
    })
  }

  // Check for long chains
  const chainLengths = new Map<string, number>()

  function calculateChainLength(nodeId: string): number {
    if (chainLengths.has(nodeId)) {
      return chainLengths.get(nodeId)!
    }

    const incomingEdges = edges.filter((e) => e.target === nodeId)
    if (incomingEdges.length === 0) {
      chainLengths.set(nodeId, 1)
      return 1
    }

    const maxParentChain = Math.max(...incomingEdges.map((e) => calculateChainLength(e.source)))
    const length = maxParentChain + 1
    chainLengths.set(nodeId, length)
    return length
  }

  nodes.forEach((node) => calculateChainLength(node.id))

  const longChains = nodes.filter((node) => {
    const length = chainLengths.get(node.id) || 0
    return length > 10
  })

  if (longChains.length > 0) {
    longChains.forEach((node) => {
      issues.push({
        type: "info",
        nodeId: node.id,
        message: "Long execution chain detected (>10 nodes deep)",
        suggestion: "Consider breaking into smaller workflows or adding checkpoints for better debugging"
      })
    })
  }

  return issues
}

export function validateApiKeys(apiKeys: Record<string, string>, nodes: Node[]): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const requiredProviders = new Set<string>()

  nodes.forEach((node) => {
    const data = node.data as any
    if (node.type === "textModel" && data.model) {
      const provider = data.model.split("/")[0]
      requiredProviders.add(provider)
    }
    if (node.type === "imageGeneration") {
      requiredProviders.add("google")
    }
  })

  requiredProviders.forEach((provider) => {
    if (!apiKeys[provider] || apiKeys[provider].trim() === "") {
      issues.push({
        type: "error",
        message: `Missing ${provider.charAt(0).toUpperCase() + provider.slice(1)} API Key - Workflow uses ${provider} models but no key is configured`,
        field: provider,
        suggestion: "Click API Keys to add your credentials"
      })
    }
  })

  return issues
}

export function calculateValidationScore(issues: ValidationIssue[]): number {
  const errorCount = issues.filter((i) => i.type === "error").length
  const warningCount = issues.filter((i) => i.type === "warning").length

  if (errorCount > 0) {
    return Math.max(0, 40 - errorCount * 10)
  }

  if (warningCount > 0) {
    return Math.max(60, 90 - warningCount * 10)
  }

  return 100
}

export function getValidationGrade(score: number): string {
  if (score >= 90) return "A"
  if (score >= 80) return "B"
  if (score >= 70) return "C"
  if (score >= 60) return "D"
  return "F"
}
