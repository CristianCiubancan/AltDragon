# AltV Core Resource Framework

A framework for AltV that provides a core resource to manage plugins.

## Features

- **Core Resource**: Centralized management of plugins
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
pnpm deploy-plugins
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
│   ├── index.ts               # Main client entry point
│   └── html/                  # HTML UI files
│       └── ui.html            # Example UI file
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
};

// Register the plugin with the core resource
core.registerPlugin(metadata, lifecycle);
```

#### Client-Side (src/plugins/my-plugin/client/index.ts)

```typescript
import * as alt from 'alt-client';
import * as native from 'natives';

// Access the core API
const core = (globalThis as any).core;

// UI state
let uiWebView: alt.WebView | null = null;
let uiVisible = false;

// Initialize the client-side plugin
function init(): void {
  if (!core) {
    alt.logError('[MY-PLUGIN] Core API not found!');
    return;
  }

  core.log('My plugin client-side initialized!');

  // Register event handlers
  registerEventHandlers();

  // Register key bindings
  registerKeyBindings();
}

/**
 * Register event handlers
 */
function registerEventHandlers(): void {
  // Listen for UI toggle events from the server
  alt.onServer('my-plugin:toggleUI', toggleUI);

  // Listen for hot reload events from the core
  core.on('core:hotReload', (pluginId: string) => {
    core.log(`Hot reload triggered for plugin: ${pluginId}`);
  });
}

/**
 * Register key bindings
 */
function registerKeyBindings(): void {
  // Register Shift+U key binding to toggle UI
  alt.on('keyup', (key: number) => {
    // Key code 85 is 'U'
    if (key === 85 && alt.isKeyDown(16)) {
      // 16 is Shift
      toggleUI();
    }
  });
}

/**
 * Toggle the UI visibility
 */
function toggleUI(): void {
  if (uiVisible) {
    destroyUI();
  } else {
    createUI();
  }
}

/**
 * Create and show the UI
 */
function createUI(): void {
  if (uiWebView) {
    destroyUI();
  }

  // Create the WebView with our HTML file
  uiWebView = new alt.WebView('http://resource/client/html/ui.html');

  // Show the cursor
  alt.showCursor(true);

  // Set UI as visible
  uiVisible = true;
}

/**
 * Destroy the UI
 */
function destroyUI(): void {
  if (uiWebView) {
    uiWebView.destroy();
    uiWebView = null;
  }

  // Hide the cursor
  alt.showCursor(false);

  // Set UI as hidden
  uiVisible = false;
}

// Initialize the plugin
init();
```

#### HTML UI (src/plugins/my-plugin/client/html/ui.html)

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My Plugin UI</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: rgba(0, 0, 0, 0.7);
        color: white;
        margin: 0;
        padding: 20px;
      }

      .container {
        max-width: 500px;
        margin: 0 auto;
        background-color: rgba(50, 50, 50, 0.8);
        border-radius: 5px;
        padding: 20px;
      }

      h1 {
        text-align: center;
        color: #4caf50;
      }

      button {
        background-color: #4caf50;
        color: white;
        border: none;
        padding: 10px 15px;
        margin: 5px;
        border-radius: 4px;
        cursor: pointer;
      }

      button:hover {
        background-color: #45a049;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>My Plugin UI</h1>
      <p>This is a simple UI for my plugin.</p>
      <button id="closeBtn">Close UI</button>
    </div>

    <script>
      // Check if alt exists (we're in the game)
      if (typeof alt !== 'undefined') {
        // Close button
        document.getElementById('closeBtn').addEventListener('click', () => {
          alt.emit('ui:close');
        });

        // Listen for data from the game
        alt.on('ui:updateData', (data) => {
          console.log('Received data:', data);
        });
      } else {
        console.log('Running in browser mode - alt API not available');
      }
    </script>
  </body>
</html>
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
- `pnpm dev`: Start development with hot reloading
- `pnpm dev:no-hot`: Start development without hot reloading
- `pnpm deploy-plugins`: Deploy plugins to the resources directory
- `pnpm kill-server`: Kill any running AltV server processes

See [BUILD-README.md](BUILD-README.md) for detailed information about the build system.

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

## License

This project is licensed under the MIT License - see the LICENSE file for details.
