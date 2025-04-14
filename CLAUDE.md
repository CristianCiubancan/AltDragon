# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run Commands
- Install dependencies: `pnpm install`
- Development mode: `pnpm dev` (runs TypeScript compiler in watch mode, Vite dev server, and alt:V server)
- Production build and start: `pnpm start` (builds with Vite, runs Node.js app, and starts alt:V server)
- Download alt:V binaries: `pnpm binaries` (automatically run on postinstall)
- Lint: Currently no linting configured, consider adding ESLint with `pnpm add -D eslint`
- Tests: No test framework configured yet (`pnpm test` exists but needs implementation)

## Code Style Guidelines
- Use TypeScript for type safety (all alt:V types are globally available)
- Format with appropriate indentation (2 spaces)
- Use PascalCase for classes, camelCase for variables/functions
- Group imports: Node built-ins → third-party → local modules → relative imports
- Prefer async/await over callbacks
- Use descriptive variable names
- Handle errors with try/catch blocks
- Document complex functions with JSDoc comments
- For alt:V specific code, follow the type definitions from @altv/* packages
- Use ES2020 features, modules are in ESNext format

## Project Structure
- Organize code by feature/module
- `modules/` directory for game logic components
- `resources/` for static assets
- `data/` for data files
- Follow alt:V resource structure conventions