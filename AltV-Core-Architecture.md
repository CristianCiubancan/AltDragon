# AltV Core Resource Architecture

## Overview

This document outlines the architecture for a core resource system in our AltV project. The core resource will:

1. Act as a central management system for all plugins
2. Handle compilation and synchronization of resources
3. Maintain a clean separation between source code and compiled resources

## Project Structure

```
d:\AltDragon\
├── src/
│   ├── core/                      # Core resource TypeScript source
│   │   ├── server/                # Server-side core code
│   │   │   ├── index.ts           # Main server entry point
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
│   └── build.js                   # Production build script
└── package.json                   # Project dependencies and scripts
```

## Core Resource Implementation

### Server-Side Core (src/core/server/index.ts)

The server-side core will:

- Initialize the plugin system
- Provide an API for plugins to register themselves
- Handle inter-plugin communication

### Plugin Manager (src/core/server/plugin-manager.ts)

The plugin manager will:

- Maintain a registry of all loaded plugins
- Provide dependency resolution between plugins
- Handle plugin lifecycle (load, unload)
- Expose a clean API for plugins to interact with each other

## Build System

### Development Mode

The development build process will:

1. Compile TypeScript code using esbuild
2. Copy necessary files to the resources/main directory
3. Start the AltV server with the core resource

### Production Mode

The production build process will:

1. Compile TypeScript code with optimizations
2. Bundle resources efficiently
3. Generate production-ready resource.toml files
4. Prepare the resources/main directory for deployment

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
4. Create an example plugin using the new architecture
5. Test and refine the system

## Conclusion

This architecture provides a robust foundation for AltV plugin development with:

- Clean separation of concerns
- Consistent plugin structure
- Centralized management through the core resource
