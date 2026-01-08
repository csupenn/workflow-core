import { Node, Edge } from '@xyflow/react'

export type WorkflowStatus = 'idle' | 'running' | 'completed' | 'error'

export type NodeStatus = 'idle' | 'running' | 'completed' | 'error'

export interface WorkflowMetadata {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
  version?: number
}

export interface SavedWorkflow extends WorkflowMetadata {
  nodes: Node[]
  edges: Edge[]
}

export interface ExecutionContext {
  apiKeys: Record<string, string>
  variables?: Record<string, any>
}

export interface ExecutionUpdate {
  type: 'node_start' | 'node_complete' | 'node_error' | 'complete' | 'error'
  nodeId?: string
  output?: any
  error?: string
}

export interface ExecutionResult {
  success: boolean
  results: Record<string, any>
  error?: string
}
