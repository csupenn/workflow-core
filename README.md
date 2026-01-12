# @charliesu/workflow-core

[![npm version](https://img.shields.io/npm/v/@charliesu/workflow-core.svg)](https://www.npmjs.com/package/@charliesu/workflow-core)
[![npm downloads](https://img.shields.io/npm/dm/@charliesu/workflow-core.svg)](https://www.npmjs.com/package/@charliesu/workflow-core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Shared workflow validation and type definitions for TopFlow and TaraFlow - React Flow based workflow orchestration library.

> **Current Version**: 0.0.2-alpha
> **Status**: Alpha - API may change

## Installation

```bash
npm install @charliesu/workflow-core
```

Or using other package managers:

```bash
# pnpm
pnpm add @charliesu/workflow-core

# yarn
yarn add @charliesu/workflow-core
```

## Usage

### Workflow Validation

```typescript
import {
  validateWorkflow,
  validateApiKeys,
  calculateValidationScore,
  getValidationGrade,
  type ValidationIssue
} from '@charliesu/workflow-core';
import type { Node, Edge } from '@xyflow/react';

// Validate workflow structure
const nodes: Node[] = [
  {
    id: '1',
    type: 'start',
    position: { x: 0, y: 0 },
    data: {}
  },
  {
    id: '2',
    type: 'textModel',
    position: { x: 200, y: 0 },
    data: { model: 'gpt-4o', temperature: 0.7 }
  }
];

const edges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2' }
];

// Run validation
const issues: ValidationIssue[] = validateWorkflow(nodes, edges);

// Check API keys
const apiKeys = { openai: 'sk-...' };
const keyIssues = validateApiKeys(apiKeys, nodes);

// Calculate validation score (0-100)
const score = calculateValidationScore([...issues, ...keyIssues]);
const grade = getValidationGrade(score); // A, B, C, D, or F

console.log(`Validation: ${grade} (${score}/100)`);
console.log(`Issues:`, issues);
```

### ValidationIssue Type

```typescript
interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  nodeId?: string;          // Optional: specific node with issue
  message: string;          // Human-readable error message
  field?: string;           // Optional: specific field with issue
  suggestion?: string;      // Optional: how to fix
}
```

## Features

- ✅ **Workflow Validation** - Comprehensive validation for React Flow workflows
  - Cycle detection (prevents infinite loops)
  - Orphan node detection
  - Missing configuration checks
  - SSRF protection for HTTP nodes
- 🔐 **Security-First** - Built-in security validations
  - URL safety checks (blocks localhost, private IPs, metadata endpoints)
  - API key validation
  - Protocol restrictions (HTTP/HTTPS only)
- 📊 **Validation Scoring** - Grade workflows A-F based on issues
- 📦 **TypeScript Support** - Full type safety with TypeScript definitions
- 🎯 **Shared Library** - Common validation logic for TopFlow and TaraFlow
- ⚡ **Zero Dependencies** - Only peer dependencies on React and @xyflow/react

## Requirements

This package has peer dependencies that you need to install:

- React >= 19.0.0
- React DOM >= 19.0.0

## Validation Checks

### Structural Validation
- **Cycle Detection** - Identifies circular dependencies that would cause infinite loops
- **Orphan Nodes** - Finds disconnected nodes that won't execute
- **Start Node** - Ensures workflow has an entry point
- **Unreachable End Nodes** - Detects end nodes with no incoming connections

### Configuration Validation
Validates node-specific requirements:
- **Text Model Nodes** - Requires model selection
- **HTTP Request Nodes** - Requires valid URL, checks for SSRF vulnerabilities
- **Prompt Nodes** - Warns about empty content
- **Conditional Nodes** - Requires condition expression
- **Unused Outputs** - Detects nodes whose output is never used
- **Long Chains** - Warns about chains >10 nodes deep

### Security Validation
- **SSRF Prevention** - Blocks requests to:
  - localhost, 127.0.0.1, 0.0.0.0
  - Private IP ranges (10.x, 172.16.x, 192.168.x)
  - Cloud metadata endpoints (AWS, GCP)
- **Protocol Restrictions** - Only allows HTTP/HTTPS
- **API Key Validation** - Ensures required provider keys are configured

### Supported Node Types
- **Entry/Exit**: `start`, `end`
- **AI Nodes**: `textModel`, `embeddingModel`, `imageGeneration`, `audio`
- **Data Nodes**: `prompt`, `javascript`, `structuredOutput`
- **Flow Control**: `conditional`, `httpRequest`
- **Tools**: `tool`

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Watch mode for development
pnpm build:watch

# Clean build artifacts
pnpm clean

# Run tests
pnpm test
```

## Architecture

This package provides the core workflow engine that is shared between:

- **[TopFlow](https://topflow.dev)** - Privacy-first visual workflow builder for AI systems
- **TaraFlow** - AI workflow orchestration platform

The forked foundation architecture allows both projects to share common workflow logic while maintaining their unique features.

## API Reference

### Core Functions

- `validateWorkflow(nodes, edges)` - Validates workflow structure and configuration
- `validateApiKeys(apiKeys, nodes)` - Validates required API keys for nodes
- `calculateValidationScore(issues)` - Calculates 0-100 score from issues
- `getValidationGrade(score)` - Converts score to letter grade (A-F)
- `isUrlSafe(url)` - Checks if URL is safe (no SSRF)
- `detectCycles(nodes, edges)` - Finds circular dependencies

### Types

- `ValidationIssue` - Validation error/warning/info object
- `ValidationIssueType` - Type literal: `'error' | 'warning' | 'info'`

## Changelog

### 0.0.2-alpha (2026-01-12)
- **Breaking**: Updated `ValidationIssue` interface
  - Removed: `id`, `title`, `description`, `nodeIds[]`, `fixable`
  - Added: `message` (combined title+description), `nodeId?` (single node), `field?`, `suggestion?`
- Improved validation messages with actionable suggestions
- Consolidated duplicate type definitions
- Fixed type exports for better IDE support

### 0.0.1-alpha (2026-01-11)
- Initial alpha release
- Core validation functions
- TypeScript type definitions
- SSRF protection

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT © [Charlie Su](https://charliesu.com)

## Links

- **TopFlow**: [topflow.dev](https://topflow.dev)
- **GitHub**: [github.com/csupenn/workflow-core](https://github.com/csupenn/workflow-core)
- **npm**: [npmjs.com/package/@charliesu/workflow-core](https://www.npmjs.com/package/@charliesu/workflow-core)
- **Issues**: [github.com/csupenn/workflow-core/issues](https://github.com/csupenn/workflow-core/issues)

## Related Projects

- **[TopFlow](https://github.com/csupenn/topflow)** - Open-source visual workflow builder for secure AI applications
- **TaraFlow** - AI workflow orchestration (coming soon)

---

**Built with ❤️ by [Charlie Su](https://charliesu.com) | Former CISO | AI Security Expert**
