import type { Node, Edge } from "@xyflow/react"

export type ValidationIssue = {
  id: string
  type: "error" | "warning" | "info"
  title: string
  description: string
  nodeIds: string[]
  fixable: boolean
}

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
    cycles.forEach((cycle, index) => {
      issues.push({
        id: `cycle-${index}`,
        type: "error",
        title: "Cycle Detected",
        description: `Infinite loop detected. Execution will never complete.`,
        nodeIds: cycle,
        fixable: false,
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
    issues.push({
      id: "orphan-nodes",
      type: "warning",
      title: `${orphanNodes.length} Orphan Node${orphanNodes.length > 1 ? "s" : ""}`,
      description: "These nodes are not connected to the workflow and will not execute.",
      nodeIds: orphanNodes.map((n) => n.id),
      fixable: true,
    })
  }

  // Check for start node
  const hasStartNode = nodes.some((node) => node.type === "start")
  if (!hasStartNode && nodes.length > 0) {
    issues.push({
      id: "no-start-node",
      type: "warning",
      title: "No Start Node",
      description: "Add a Start node to define the workflow entry point.",
      nodeIds: [],
      fixable: false,
    })
  }

  // Check for unreachable end nodes
  const endNodes = nodes.filter((node) => node.type === "end")
  endNodes.forEach((endNode) => {
    const hasPath = edges.some((edge) => edge.target === endNode.id)
    if (!hasPath && nodes.length > 1) {
      issues.push({
        id: `unreachable-end-${endNode.id}`,
        type: "warning",
        title: "Unreachable End Node",
        description: "This end node cannot be reached from any other node.",
        nodeIds: [endNode.id],
        fixable: false,
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
            id: `missing-model-${node.id}`,
            type: "error",
            title: "Missing Model Configuration",
            description: "Text Model node requires a model to be selected.",
            nodeIds: [node.id],
            fixable: false,
          })
        }
        break

      case "httpRequest":
        if (!data.url) {
          issues.push({
            id: `missing-url-${node.id}`,
            type: "error",
            title: "Missing URL",
            description: "HTTP Request node requires a URL.",
            nodeIds: [node.id],
            fixable: false,
          })
        } else if (!isUrlSafe(data.url)) {
          issues.push({
            id: `unsafe-url-${node.id}`,
            type: "error",
            title: "Unsafe URL Detected",
            description:
              "URL points to private network or uses an unsupported protocol. Only public HTTP/HTTPS endpoints are allowed.",
            nodeIds: [node.id],
            fixable: false,
          })
        }
        break

      case "prompt":
        if (!data.content) {
          issues.push({
            id: `missing-prompt-${node.id}`,
            type: "warning",
            title: "Empty Prompt",
            description: "Prompt node has no content.",
            nodeIds: [node.id],
            fixable: false,
          })
        }
        break

      case "conditional":
        if (!data.condition) {
          issues.push({
            id: `missing-condition-${node.id}`,
            type: "error",
            title: "Missing Condition",
            description: "Conditional node requires a condition expression.",
            nodeIds: [node.id],
            fixable: false,
          })
        }
        break
    }
  })

  // Check for unused outputs
  const targetNodes = new Set(edges.map((e) => e.target))
  const unusedOutputs = nodes.filter((node) => !targetNodes.has(node.id) && node.type !== "end" && nodes.length > 1)

  if (unusedOutputs.length > 0) {
    issues.push({
      id: "unused-outputs",
      type: "info",
      title: `${unusedOutputs.length} Node${unusedOutputs.length > 1 ? "s" : ""} with Unused Outputs`,
      description: "These nodes have outputs that are not connected to any other nodes.",
      nodeIds: unusedOutputs.map((n) => n.id),
      fixable: false,
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
    issues.push({
      id: "long-chains",
      type: "info",
      title: "Long Execution Chains Detected",
      description: "Consider adding checkpoints or breaking long chains into smaller workflows for better debugging.",
      nodeIds: longChains.map((n) => n.id),
      fixable: false,
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
        id: `missing-api-key-${provider}`,
        type: "error",
        title: `Missing ${provider.charAt(0).toUpperCase() + provider.slice(1)} API Key`,
        description: `Your workflow uses ${provider} models but no API key is configured. Click API Keys to add it.`,
        nodeIds: [],
        fixable: true,
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
