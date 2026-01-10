# @charliesu/workflow-core

[![npm version](https://img.shields.io/npm/v/@charliesu/workflow-core.svg)](https://www.npmjs.com/package/@charliesu/workflow-core)
[![npm downloads](https://img.shields.io/npm/dm/@charliesu/workflow-core.svg)](https://www.npmjs.com/package/@charliesu/workflow-core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Shared workflow engine for TopFlow and TaraFlow - React Flow based workflow orchestration library.

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

```typescript
import { WorkflowEngine, WorkflowNode, WorkflowEdge } from '@charliesu/workflow-core';

// Define your workflow
const nodes: WorkflowNode[] = [
  {
    id: '1',
    type: 'start',
    position: { x: 0, y: 0 },
    data: { label: 'Start' }
  },
  {
    id: '2',
    type: 'textModel',
    position: { x: 200, y: 0 },
    data: { model: 'gpt-4', temperature: 0.7 }
  }
];

const edges: WorkflowEdge[] = [
  {
    id: 'e1-2',
    source: '1',
    target: '2'
  }
];

// Use the workflow engine
// ... (your implementation)
```

## Features

- 🔄 **React Flow Integration** - Built on top of React Flow for visual workflow editing
- 📦 **TypeScript Support** - Full type safety with TypeScript definitions
- 🎯 **Shared Engine** - Common workflow engine for TopFlow and TaraFlow projects
- ⚡ **Type-Safe Workflows** - Strongly typed workflow definitions
- 🔐 **Security-First** - Built with security patterns in mind

## Requirements

This package has peer dependencies that you need to install:

- React >= 19.0.0
- React DOM >= 19.0.0

## Node Types

The workflow engine supports various node types including:

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
