# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands
- `pnpm build` - Build the project
- `pnpm build:prod` - Build for production
- `pnpm dev` - Run in development mode with hot reloading
- `pnpm dev:no-hot` - Run in development mode without hot reloading
- `pnpm deploy-plugins` - Deploy plugins
- `pnpm kill-server` - Kill the server process

## Code Style Guidelines
- **Imports**: Use ES modules with named imports from specific files (`import { x } from './y.js'`)
- **Types**: Strong typing with TypeScript, use interfaces for shared contracts
- **Functions**: JSDoc comments for all functions with descriptions and parameter docs
- **Error Handling**: Use try/catch blocks for operations that might fail
- **Naming**: Use camelCase for variables/functions, PascalCase for interfaces/types
- **File Structure**: Plugins have client/server/shared directories
- **Plugin Architecture**: Follow the plugin lifecycle hooks in interfaces.ts
- **Logging**: Use alt.log with color prefixes for consistent console output