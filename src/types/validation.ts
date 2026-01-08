import { Node, Edge } from '@xyflow/react'

export type ValidationIssueType = 'error' | 'warning' | 'info'

export interface ValidationIssue {
  type: ValidationIssueType
  nodeId?: string
  message: string
  field?: string
  suggestion?: string
}

export interface ValidationResult {
  valid: boolean
  issues: ValidationIssue[]
  score: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  canExecute: boolean
}

export interface ValidationConfig {
  checkCycles?: boolean
  checkSsrf?: boolean
  checkApiKeys?: boolean
  checkConfiguration?: boolean
  strictMode?: boolean
}
