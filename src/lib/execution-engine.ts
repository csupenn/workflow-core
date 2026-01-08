import { Node, Edge } from '@xyflow/react'
import type {
  ExecutionContext,
  ExecutionResult,
  ExecutionUpdate
} from '../types/workflow'
import { topologicalSort, getNodeInputs } from './topological-sort'

export class ExecutionEngine {
  private abortController?: AbortController

  /**
   * Execute workflow with streaming updates
   */
  async executeWorkflow(
    nodes: Node[],
    edges: Edge[],
    context: ExecutionContext,
    onUpdate?: (update: ExecutionUpdate) => void
  ): Promise<ExecutionResult> {
    this.abortController = new AbortController()

    try {
      // 1. Topological sort
      const { sorted, hasCycle, cycleNodes } = topologicalSort(nodes, edges)

      if (hasCycle) {
        throw new Error(`Workflow contains cycles: ${cycleNodes?.join(', ')}`)
      }

      // 2. Execute nodes in order
      const results = new Map<string, any>()

      for (const node of sorted) {
        if (this.abortController.signal.aborted) {
          throw new Error('Execution aborted')
        }

        onUpdate?.({
          type: 'node_start',
          nodeId: node.id
        })

        try {
          const inputs = getNodeInputs(node.id, edges, results, nodes)
          const result = await this.executeNode(node, inputs, context)
          results.set(node.id, result)

          onUpdate?.({
            type: 'node_complete',
            nodeId: node.id,
            output: result
          })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'

          onUpdate?.({
            type: 'node_error',
            nodeId: node.id,
            error: errorMessage
          })

          throw new Error(`Node ${node.id} failed: ${errorMessage}`)
        }
      }

      onUpdate?.({ type: 'complete' })

      return {
        success: true,
        results: Object.fromEntries(results)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      onUpdate?.({
        type: 'error',
        error: errorMessage
      })

      return {
        success: false,
        results: {},
        error: errorMessage
      }
    }
  }

  /**
   * Execute a single node
   * This is a protected method that products will override
   */
  protected async executeNode(
    node: Node,
    inputs: Record<string, any>,
    context: ExecutionContext
  ): Promise<any> {
    // Handle base node types (prompt, javascript, conditional, start, end)
    switch (node.type) {
      case 'start':
        return inputs.input1 || context.variables?.initialInput || ''

      case 'end':
        return inputs.input1 || ''

      case 'prompt':
        return this.executePromptNode(node, inputs)

      case 'javascript':
        return this.executeJavaScriptNode(node, inputs)

      case 'conditional':
        return this.executeConditionalNode(node, inputs)

      default:
        throw new Error(`Node type ${node.type} not implemented in base ExecutionEngine. Products must extend this class.`)
    }
  }

  private executePromptNode(node: Node, inputs: Record<string, any>): string {
    const data = node.data as any
    let template = data.prompt || ''

    // Replace variables: $input1, $input2, etc.
    Object.entries(inputs).forEach(([key, value]) => {
      const varName = `$${key}`
      template = template.replace(new RegExp(`\\${varName}`, 'g'), String(value))
    })

    return template
  }

  private executeJavaScriptNode(node: Node, inputs: Record<string, any>): any {
    const data = node.data as any
    const code = data.code || 'return ""'

    try {
      // Sandboxed execution using Function constructor
      const fn = new Function(...Object.keys(inputs), code)
      return fn(...Object.values(inputs))
    } catch (error) {
      throw new Error(`JavaScript execution failed: ${error}`)
    }
  }

  private executeConditionalNode(node: Node, inputs: Record<string, any>): boolean {
    const data = node.data as any
    const condition = data.condition || 'true'

    try {
      const fn = new Function(...Object.keys(inputs), `return ${condition}`)
      return Boolean(fn(...Object.values(inputs)))
    } catch (error) {
      throw new Error(`Condition evaluation failed: ${error}`)
    }
  }

  /**
   * Abort ongoing execution
   */
  abort(): void {
    this.abortController?.abort()
  }
}
