/**
 * Example plugin with HTML UI - Client-side entry point
 */

import * as alt from 'alt-client';
import * as native from 'natives';

// Access the core API
const core = (globalThis as any).core;

// UI state
let uiWebView: alt.WebView | null = null;
let uiVisible = false;

/**
 * Initialize the client-side plugin
 */
function init(): void {
  if (!core) {
    alt.logError('[EXAMPLE-HTML] Core API not found!');
    return;
  }

  core.log('Example HTML plugin client-side initialized!');

  // Register event handlers
  registerEventHandlers();

  // Register key bindings
  registerKeyBindings();
}

/**
 * Register event handlers
 */
function registerEventHandlers(): void {
  // Listen for notification events from the server
  alt.onServer('example:notification', showNotification);
  
  // Listen for UI toggle events from the server
  alt.onServer('example:toggleUI', toggleUI);
  
  // Listen for hot reload events from the core
  core.on('core:hotReload', (pluginId: string) => {
    core.log(`Hot reload triggered for plugin: ${pluginId}`);
    
    // Recreate UI if it was visible
    if (pluginId === 'example-html' && uiVisible) {
      destroyUI();
      createUI();
    }
  });
}

/**
 * Register key bindings
 */
function registerKeyBindings(): void {
  // Register Shift+U key binding to toggle UI
  alt.on('keyup', (key: number) => {
    // Key code 85 is 'U'
    if (key === 85 && alt.isKeyDown(16)) { // 16 is Shift
      toggleUI();
    }
  });
}

/**
 * Show a notification to the player
 * @param message The message to show
 */
function showNotification(message: string): void {
  // Use GTA native notification
  native.beginTextCommandThefeedPost('STRING');
  native.addTextComponentSubstringPlayerName(message);
  native.endTextCommandThefeedPostTicker(false, true);
  
  core.log(`Notification: ${message}`);
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
  
  // Handle messages from the UI
  uiWebView.on('ui:close', destroyUI);
  
  uiWebView.on('ui:action', (action: string, ...args: any[]) => {
    core.log(`UI action: ${action}, args: ${JSON.stringify(args)}`);
    
    // Handle different actions
    switch (action) {
      case 'teleport':
        if (args.length >= 3) {
          const [x, y, z] = args;
          native.setEntityCoords(
            alt.Player.local.scriptID,
            x,
            y,
            z,
            false,
            false,
            false,
            false
          );
        }
        break;
        
      case 'heal':
        alt.emitServer('example:heal');
        break;
        
      default:
        core.log(`Unknown UI action: ${action}`);
        break;
    }
  });
  
  // Show the cursor
  alt.showCursor(true);
  
  // Set UI as visible
  uiVisible = true;
  
  // Send player data to the UI
  updateUIData();
}

/**
 * Update the UI with player data
 */
function updateUIData(): void {
  if (!uiWebView) return;
  
  const player = alt.Player.local;
  
  // Get player position
  const pos = player.pos;
  
  // Send data to the UI
  uiWebView.emit('ui:updateData', {
    name: player.name,
    id: player.id,
    position: {
      x: pos.x.toFixed(2),
      y: pos.y.toFixed(2),
      z: pos.z.toFixed(2),
    },
    health: player.health,
    armor: player.armour,
  });
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

// Export functions for hot reloading
export { init, toggleUI, showNotification };
