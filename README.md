# AltV Core Resource Framework

A framework for AltV that provides a core resource to manage plugins and hot reloading functionality.

## Features

- **Core Resource**: Centralized management of plugins
- **Hot Reloading**: Automatic reloading of resources when code changes
- **TypeScript Support**: Full TypeScript support for type safety
- **Plugin System**: Easy-to-use plugin system with lifecycle hooks
- **Cross-Platform**: Works on both Windows and Linux

## Getting Started

### Prerequisites

- Node.js 16+
- pnpm
- AltV Server

### Installation

1. Clone the repository
2. Install dependencies:

```bash
pnpm install
```

3. Build the project:

```bash
pnpm build
```

4. Start the development server:

```bash
pnpm dev
```

## Development Workflow

### Project Structure

```
src/
├── core/                      # Core resource TypeScript source
│   ├── server/                # Server-side core code
│   ├── client/                # Client-side core code
│   └── shared/                # Shared code between client/server
└── plugins/                   # Plugin source code (TypeScript)
    ├── example-ts/            # Example TypeScript plugin
    └── [other-plugins]/       # Other plugins
```

**Note:** All plugin development should be done in the `src/plugins` directory. The compiled output will be placed in `resources/main/plugins`.

### Creating a New Plugin

1. Create a new directory in `src/plugins/` with your plugin name
2. Create the following structure:

```
src/plugins/my-plugin/
├── server/                    # Server-side plugin code
│   └── index.ts               # Main server entry point
├── client/                    # Client-side plugin code
│   └── index.ts               # Main client entry point
├── shared/                    # Shared code
└── resource.toml              # Resource configuration
```

3. Implement your plugin using the core API

### Plugin Implementation

#### Server-Side (src/plugins/my-plugin/server/index.ts)

```typescript
import * as alt from 'alt-server';
import {
  PluginMetadata,
  PluginLifecycle,
  CoreAPI,
} from '../../../core/shared/interfaces';

// Access the core API
const core = (global as any).core as CoreAPI;

// Plugin metadata
const metadata: PluginMetadata = {
  id: 'my-plugin',
  name: 'My Plugin',
  version: '1.0.0',
  author: 'Your Name',
  description: 'My awesome plugin',
  dependencies: ['core'],
  supportsHotReload: true,
};

// Plugin lifecycle hooks
const lifecycle: PluginLifecycle = {
  onLoad: () => {
    core.log('My plugin loaded!');
    // Initialize your plugin here
  },

  onUnload: () => {
    core.log('My plugin unloaded!');
    // Clean up resources here
  },

  onReload: () => {
    core.log('My plugin reloaded!');
    // Handle reload here
  },
};

// Register the plugin with the core resource
core.registerPlugin(metadata, lifecycle);
```

#### Client-Side (src/plugins/my-plugin/client/index.ts)

```typescript
import * as alt from 'alt-client';

// Access the core API
const core = (window as any).core;

// Initialize the client-side plugin
function init(): void {
  if (!core) {
    alt.logError('[MY-PLUGIN] Core API not found!');
    return;
  }

  core.log('My plugin client-side initialized!');

  // Initialize your client-side plugin here
}

// Initialize the plugin
init();
```

### Resource Configuration (src/plugins/my-plugin/resource.toml)

```toml
type = "js"
main = "server/index.js"
client-main = "client/index.js"
client-files = ["client/*"]
deps = ["core"]
```

## Available Scripts

- `pnpm build`: Build the project for development
- `pnpm build:prod`: Build the project for production
- `pnpm hot-reload`: Start the hot reload system
- `pnpm deploy-plugins`: Deploy plugins to the resources directory
- `pnpm dev`: Start the development server (Windows)
- `pnpm dev:linux`: Start the development server (Linux)

## Core API

The core resource provides an API for plugins to interact with:

### Server-Side API

- `registerPlugin(metadata, lifecycle)`: Register a plugin with the core resource
- `getPlugin(pluginId)`: Get a plugin by ID
- `isPluginLoaded(pluginId)`: Check if a plugin is loaded
- `log(message, level)`: Log a message to the console
- `on(eventName, handler)`: Register an event handler
- `emit(eventName, ...args)`: Emit an event

### Client-Side API

- `on(eventName, handler)`: Register an event handler
- `emit(eventName, ...args)`: Emit an event
- `log(message, level)`: Log a message to the console
- `getVersion()`: Get the core version

## Hot Reloading

The hot reload system watches for file changes in the `src` directory and automatically:

1. Recompiles the changed files
2. Syncs the compiled files to the resources directory
3. Triggers a resource reload in the AltV server

This allows for rapid development without having to restart the server.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
