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

**Note:** All plugin development should be done in the `src/plugins` directory. The compiled output will be placed in `resources/main/core/plugins`.

### Build Process

When you build the project, the following happens:

1. The source files in `src/core` and `src/plugins` are compiled using TypeScript
2. All plugins are built into the core resource's directory structure:
   ```
   resources/
   └── main/
       └── core/               # Core resource
           ├── server/         # Server-side core code
           ├── client/         # Client-side core code
           ├── shared/         # Shared code
           ├── plugins/        # All plugins are built here
           │   ├── example-ts/
           │   │   ├── client/
           │   │   ├── server/
           │   │   └── metadata.json
           │   └── example-html/
           │       ├── client/
           │       ├── server/
           │       └── metadata.json
           └── resource.toml   # Main resource configuration (includes all plugins)
   ```

3. The core's `resource.toml` is updated to include all plugin files
4. HTML and other assets are copied to their respective locations

This structure means that all plugins are part of the same resource (the core resource), which allows for better integration and communication between plugins.

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
  if (uiVisible) {
    destroyUI();
  }
  
  // Define UI event handlers
  const eventHandlers = {
    'uiReady': () => {
      core.log('UI is ready');
      
      // Send data to the UI
      uiWebView?.emit('updateData', {
        playerName: alt.Player.local.name,
        health: alt.Player.local.health
      });
    }
  };
  
  // Create the WebView with our HTML file using the core API
  uiWebView = core.createUIWebView('my-plugin', 'client/html/ui.html', {
    handleCursor: true,
    disableControls: true,
    eventHandlers: eventHandlers
  });
  
  if (!uiWebView) {
    core.log('Failed to create UI WebView', 'error');
    return;
  }
  
  // Set UI as visible
  uiVisible = true;
}

/**
 * Destroy the UI
 */
function destroyUI(): void {
  // Use the core API to close the WebView
  if (core.hasActiveWebView('my-plugin')) {
    core.closeUIWebView('my-plugin');
    uiWebView = null;
  }
  
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

## WebView Integration

### Working with WebViews

The framework provides a consistent way to create and manage WebViews in your plugins:

1. **Basic WebView Creation**

```typescript
// Create a basic WebView (standard approach)
const webview = core.createWebView('client/html/my-ui.html');

// Create a WebView with plugin-specific path resolution
const webview = core.createWebView('client/html/my-ui.html', false, 'my-plugin-id');
```

2. **Managed UI WebView Creation**

```typescript
// Create a managed UI WebView with standardized handling
const webview = core.createUIWebView('my-plugin', 'client/html/my-ui.html', {
  // These are all optional with defaults shown:
  handleCursor: true,       // Auto-show cursor
  disableControls: true,    // Disable game controls
  overlay: false,           // Use overlay mode
  eventHandlers: {          // Register event handlers
    'myEvent': (data) => {
      console.log('Event received:', data);
    }
  }
});

// Create an overlay WebView that can coexist with other WebViews
const overlayWebview = core.createUIWebView('my-plugin-overlay', 'client/html/overlay.html', {
  handleCursor: false,      // Don't show cursor for overlay
  disableControls: false,   // Don't disable game controls
  overlay: true,            // Enable overlay mode
  eventHandlers: {
    'overlayEvent': (data) => {
      console.log('Overlay event received:', data);
    }
  }
});
```

3. **Closing WebViews**

```typescript
// Close a specific WebView
core.closeUIWebView('my-plugin');

// Close all WebViews
core.closeAllWebViews();
```

4. **WebView Status**

```typescript
// Check if a plugin has an active WebView
const isActive = core.hasActiveWebView('my-plugin');

// Get all active WebViews
const activeWebViews = core.getActiveWebViews();
```

The managed WebView system automatically provides:
- Cursor show/hide with `alt.showCursor()`
- Game controls toggling with `alt.toggleGameControls()`
- WebView focus management with `webview.focus()` and `webview.unfocus()`
- Standard close events handling for 'ui:close', 'closeUI', and 'close'
- Proper cleanup when closing WebViews

This ensures all WebViews are properly clickable and interactive without manual focus management.

### Working with Multiple WebViews

The framework supports multiple concurrent WebViews:

1. **Regular WebViews**: These take over the screen, show cursor, and disable game controls
2. **Overlay WebViews**: These can be displayed alongside other UIs without disrupting gameplay

When using multiple WebViews:

```typescript
// Create a main UI (will show cursor and disable controls)
const mainUI = core.createUIWebView('my-plugin-main', 'client/html/main.html');

// Create an overlay that can be shown alongside the main UI
const statsOverlay = core.createUIWebView('my-plugin-stats', 'client/html/stats.html', {
  overlay: true,            // Make it an overlay
  handleCursor: false,      // Don't show cursor for this WebView
  disableControls: false    // Don't disable game controls
});

// You can have multiple overlays active simultaneously
const mapOverlay = core.createUIWebView('my-plugin-map', 'client/html/map.html', {
  overlay: true,
  handleCursor: false,
  disableControls: false
});
```

Focus is automatically managed to ensure clickable elements work correctly in each WebView.

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
- `standardizeUrl(url)`: Standardize a URL for WebView
- `createWebView(url, isOverlay)`: Create a WebView with a standardized URL
- `createUIWebView(pluginId, htmlPath, options)`: Create and manage a UI WebView
- `closeUIWebView(pluginId)`: Close a UI WebView
- `hasActiveWebView(pluginId)`: Check if a plugin has an active WebView
- `getActiveWebViews()`: Get all active WebViews
- `closeAllWebViews()`: Close all WebViews

## License

This project is licensed under the MIT License - see the LICENSE file for details.
