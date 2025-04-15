# Build System Improvements

This document outlines the improvements made to the build and development system for the AltV project.

## Overview of Changes

1. **Cross-Platform Compatibility**
   - Improved path handling for Windows and Linux
   - Used cross-platform file operations
   - Fixed process management for both platforms

2. **Build System**
   - Enhanced TypeScript compilation with esbuild
   - Improved error handling and reporting
   - Added better support for HTML files
   - Optimized file copying and directory handling

3. **Development Workflow**
   - Added proper hot-reloading
   - Fixed port conflict issues
   - Improved console output
   - Added separate commands for different development scenarios

4. **HTML UI Support**
   - Added support for plain HTML UI files
   - Simplified the UI development workflow
   - Provided an example plugin with HTML UI

## New Scripts

The following new scripts have been added:

- `scripts/build-improved.js` - Improved build script
- `scripts/hot-reload-improved.js` - Improved hot reload script
- `scripts/dev-improved.js` - Improved development script

## New Commands

The following new commands have been added to package.json:

- `pnpm build` - Build the project for development (using improved build script)
- `pnpm build:prod` - Build the project for production (using improved build script)
- `pnpm dev` - Start development with hot reloading
- `pnpm dev:no-hot` - Start development without hot reloading
- `pnpm deploy-plugins` - Deploy plugins to the resources directory
- `pnpm kill-server` - Kill any running AltV server processes

## Example Plugin

An example plugin with HTML UI has been added to demonstrate the new system:

- `src/plugins/example-html` - Example plugin with HTML UI

This plugin demonstrates:
- Server-side code
- Client-side code
- HTML UI
- Hot reloading support
- Shared code

## Documentation

The following documentation has been added:

- `BUILD-README.md` - Detailed documentation of the build system
- `IMPROVEMENTS.md` - This document
- Updated `README.md` - Updated with new commands and examples

## Next Steps

1. **Testing**
   - Test the new build system on both Windows and Linux
   - Test hot reloading with various plugins
   - Test HTML UI functionality

2. **Further Improvements**
   - Add support for CSS and JavaScript bundling for HTML UIs
   - Implement watch mode for specific plugins
   - Add support for plugin dependencies in hot reloading
   - Optimize build performance for large projects
