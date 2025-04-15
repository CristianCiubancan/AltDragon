# AltV Core Resource Architecture

## Overview

This document outlines the architecture for a core resource system in our AltV project. The core resource will:

1. Act as a central management system for all plugins
2. Provide hot reloading functionality for plugins during development
3. Handle compilation and synchronization of resources
4. Maintain a clean separation between source code and compiled resources

## Project Structure

```
d:\AltDragon\
├── src/
│   ├── core/                      # Core resource TypeScript source
│   │   ├── server/                # Server-side core code
│   │   │   ├── index.ts           # Main server entry point
│   │   │   ├── hot-reload.ts      # Hot reload implementation
│   │   │   └── plugin-manager.ts  # Plugin management system
│   │   ├── client/                # Client-side core code
│   │   │   ├── index.ts           # Main client entry point
│   │   │   └── ui/                # Core UI components
│   │   └── shared/                # Shared code between client/server
│   │       └── interfaces.ts      # Type definitions and interfaces
│   └── plugins/                   # Plugin source code (TypeScript)
│       ├── example-ts/            # Example TypeScript plugin
│       │   ├── server/            # Server-side plugin code
│       │   ├── client/            # Client-side plugin code
│       │   └── shared/            # Shared code
│       └── [other-plugins]/       # Other plugins follow same structure
├── resources/                     # Compiled resources (output)
│   ├── main/                      # Main resource folder (core + plugins)
│   │   ├── core/                  # Compiled core resource
│   │   │   ├── server/            # Compiled server-side code
│   │   │   ├── client/            # Compiled client-side code
│   │   │   └── resource.toml      # Core resource configuration
│   │   └── plugins/               # Compiled plugins
│   │       ├── example-ts/        # Compiled example TypeScript plugin
│   │       │   ├── server/        # Compiled server code
│   │       │   ├── client/        # Compiled client code
│   │       │   └── resource.toml  # Plugin resource configuration
│   │       └── [other-plugins]/   # Other compiled plugins
├── scripts/                       # Build and development scripts
│   ├── dev.js                     # Development script
│   ├── build.js                   # Production build script
│   └── hot-reload.js              # Hot reload script
└── package.json                   # Project dependencies and scripts
```

## Core Resource Implementation

### Server-Side Core (src/core/server/index.ts)

The server-side core will:

- Initialize the plugin system
- Set up hot reloading for development
- Provide an API for plugins to register themselves
- Handle inter-plugin communication

### Hot Reload System (src/core/server/hot-reload.ts)

The hot reload system will:

- Use esbuild to watch for file changes
- Trigger resource reloads without server restart
- Provide a clean API for plugins to hook into the reload cycle
- Handle both client and server-side reloads

### Plugin Manager (src/core/server/plugin-manager.ts)

The plugin manager will:

- Maintain a registry of all loaded plugins
- Provide dependency resolution between plugins
- Handle plugin lifecycle (load, unload, reload)
- Expose a clean API for plugins to interact with each other

## Build System

### Development Mode

The development build process will:

1. Compile TypeScript code using esbuild in watch mode
2. Copy necessary files to the resources/main directory
3. Set up hot reloading for all plugins
4. Start the AltV server with the core resource

### Production Mode

The production build process will:

1. Compile TypeScript code with optimizations
2. Bundle resources efficiently
3. Generate production-ready resource.toml files
4. Prepare the resources/main directory for deployment

## Hot Reload Implementation

The hot reload system will use esbuild's watch mode to:

1. Monitor file changes in the src directory
2. Recompile changed files
3. Sync the compiled files to the resources/main directory
4. Trigger a resource reload in the AltV server

The reload process will:

1. Preserve player state where possible
2. Reload only the affected resources
3. Provide clear feedback on reload success/failure
4. Handle dependencies between plugins correctly

## Plugin Development

Plugins will follow a consistent structure:

- Server-side code in the `server` directory
- Client-side code in the `client` directory
- Shared code in the `shared` directory
- Resource configuration in `resource.toml`

Plugins can:

- Register event handlers
- Expose APIs for other plugins
- Define dependencies on other plugins
- Hook into the hot reload cycle

## Configuration

### Core Resource Configuration (resources/main/core/resource.toml)

```toml
type = "js"
main = "server/index.js"
client-main = "client/index.js"
client-files = ["client/*"]
deps = []
```

### Plugin Resource Configuration (resources/main/plugins/example/resource.toml)

```toml
type = "js"
main = "server/index.js"
client-main = "client/index.js"
client-files = ["client/*"]
deps = ["core"]
```

## Implementation Plan

1. Create the core resource structure
2. Implement the basic plugin manager
3. Set up the build system with esbuild
4. Implement the hot reload system
5. Create an example plugin using the new architecture
6. Test and refine the system

## Conclusion

This architecture provides a robust foundation for AltV plugin development with:

- Clean separation of concerns
- Efficient hot reloading during development
- Consistent plugin structure
- Centralized management through the core resource
