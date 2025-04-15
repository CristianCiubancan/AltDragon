# AltV Build and Development System

This document explains the improved build and development system for the AltV project.

## Overview

The build system has been refactored to:

1. Improve cross-platform compatibility (Windows and Linux)
2. Optimize TypeScript compilation with esbuild
3. Handle HTML files properly (instead of webview)
4. Implement proper hot-reloading
5. Fix port conflict issues

## Scripts

### Build Scripts

- `pnpm build` - Build the project for development
- `pnpm build:prod` - Build the project for production

### Development Scripts

- `pnpm dev` - Start development with hot reloading
- `pnpm dev:no-hot` - Start development without hot reloading
- `pnpm deploy-plugins` - Deploy plugins to the resources directory
- `pnpm kill-server` - Kill any running AltV server processes

## Plugin Structure

Plugins follow a standardized structure:

```
src/plugins/[plugin-name]/
├── server/         # Server-side code
│   └── index.ts    # Main server entry point
├── client/         # Client-side code
│   ├── index.ts    # Main client entry point
│   └── html/       # HTML UI files
│       └── ui.html # Example UI file
├── shared/         # Shared code (used by both server and client)
└── resource.toml   # Plugin configuration
```

### Plugin Configuration (resource.toml)

```toml
type = "js"
main = "server/index.js"
client-main = "client/index.js"
client-files = ["client/*"]
deps = ["core"]
name = "my-plugin"
version = "1.0.0"
description = "My plugin description"
author = "Your Name"
```

## Hot Reloading

The hot reloading system:

1. Watches for file changes in the source directory
2. Rebuilds the affected resources
3. Sends a reload request to the server
4. The server reloads the affected resources without restarting

### How It Works

1. The `hot-reload.js` script starts a file watcher and a reload server
2. When a file changes, it determines which resource needs to be reloaded
3. It rebuilds the resource and sends a reload request to the server
4. The server receives the request and reloads the resource

## HTML UI Files

HTML UI files are now handled directly without using a webview framework:

1. Place your HTML files in the `client/html` directory
2. They will be automatically copied to the output directory
3. You can load them using the AltV WebView API:

```typescript
// Example of loading an HTML UI
const webview = new alt.WebView('http://resource/client/html/ui.html');
```

## Cross-Platform Compatibility

The build system is designed to work on both Windows and Linux:

1. Uses cross-platform path handling
2. Uses fs-extra for file operations
3. Detects the platform and uses the appropriate commands
4. Handles file paths consistently across platforms

## Troubleshooting

### Port Conflicts

If you encounter port conflicts with the hot reload server:

1. The system will automatically try to use a different port
2. You can manually change the port in `scripts/hot-reload.js`

### Build Errors

If you encounter build errors:

1. Check the console output for error messages
2. Make sure all dependencies are installed
3. Try running `pnpm build` to see if there are any compilation errors

### Hot Reload Not Working

If hot reloading is not working:

1. Make sure the server is running
2. Check if the file watcher is detecting changes
3. Try restarting the development server
4. Check if the reload server is running and accessible
