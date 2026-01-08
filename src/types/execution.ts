import { Node, Edge } from '@xyflow/react'

export interface TopologicalSortResult {
  sorted: Node[]
  hasCycle: boolean
  cycleNodes?: string[]
}

export interface NodeExecutionResult {
  success: boolean
  output: any
  error?: string
  executionTime?: number
}

export interface ExecutionConfig {
  timeout?: number  // Max execution time in ms (default: 30000)
  maxRetries?: number  // Max retries per node (default: 0)
  abortSignal?: AbortSignal  // For cancellation
}

export interface ExecutionMetrics {
  totalNodes: number
  executedNodes: number
  failedNodes: number
  totalExecutionTime: number
  nodeExecutionTimes: Record<string, number>
}
