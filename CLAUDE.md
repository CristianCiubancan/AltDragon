# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

- `pnpm build` - Build the project
- `pnpm build:prod` - Build for production
- `pnpm dev` - Run in development mode (hot reloading feature has been removed)
- `pnpm dev:no-hot` - Run in development mode without hot reloading
- `pnpm deploy-plugins` - Deploy plugins
- `pnpm kill-server` - Kill the server process

## Build Process

The build process transforms the source code as follows:

1. Source code in `src/core` and `src/plugins/*` is compiled using TypeScript
2. All plugins are bundled into the core resource in the output directory `resources/main/core/plugins/*`
3. Each plugin gets a metadata.json file containing information from its resource.toml
4. The core's resource.toml is updated to include all plugins' client and server files
5. This produces a single resource (core) that includes all plugins, rather than multiple resources

## Plugin Architecture

Plugins follow a standard structure:

- `client/` - Client-side code and UI
- `server/` - Server-side code
- `shared/` - Shared code between client and server
- `resource.toml` - Plugin metadata and configuration

## WebView System

The framework provides a standardized WebView API for plugins with improved management:

- Use `core.createUIWebView(pluginId, htmlPath, options)` to create managed WebViews
- Use `core.closeUIWebView(pluginId)` to close WebViews
- Events like 'ui:close', 'closeUI', 'close' are automatically handled
- Cursor and game control toggling is managed automatically
- WebView focus is managed with `webview.focus()` and `webview.unfocus()`
- WebView instances are tracked by plugin ID for easier management

### Important WebView Focus Handling

- WebViews must be focused with `webview.focus()` to be clickable
- Before destroying a WebView, it should be unfocused with `webview.unfocus()`
- The core API automatically handles these focus actions for you
- This ensures proper interaction with WebViews without manual focus management

### Multiple WebView Support

- The system supports both regular WebViews and overlay WebViews
- Regular WebViews handle cursor and game controls
- Overlay WebViews can coexist with other UIs without interfering with controls
- Example usage of multiple WebViews can be found in the example plugin
- Overlay WebViews are perfect for HUDs, info panels, and non-interactive UI elements

## Code Style Guidelines

- **Imports**: Use ES modules with named imports from specific files (`import { x } from './y.js'`)
- **Types**: Strong typing with TypeScript, use interfaces for shared contracts
- **Functions**: JSDoc comments for all functions with descriptions and parameter docs
- **Error Handling**: Use try/catch blocks for operations that might fail
- **Naming**: Use camelCase for variables/functions, PascalCase for interfaces/types
- **File Structure**: Plugins have client/server/shared directories
- **Plugin Architecture**: Follow the plugin lifecycle hooks in interfaces.ts
- **Logging**: Use alt.log with color prefixes for consistent console output
- **WebViews**: Use the core.createUIWebView system for consistent UI management

## Documentation Links

### AltV Documentation

- **Main Documentation**: https://docs.altv.mp/
- **WebView Documentation**: https://docs.altv.mp/js/articles/webview.html
- **Client API**: https://docs.altv.mp/js/api/alt-client.html
- **Server API**: https://docs.altv.mp/js/api/alt-server.html

### WebView Focus and Cursor Management

- **WebView Class**: https://docs.altv.mp/js/api/alt-client.WebView.html
- **alt.showCursor**: https://docs.altv.mp/js/api/alt-client.html#_altshowcursor
- **alt.toggleGameControls**: https://docs.altv.mp/js/api/alt-client.html#_alttogglecontrols
