/**
 * Example plugin client-side entry point
 * This demonstrates how to use the core resource API on the client side
 */

import * as alt from 'alt-client';
import * as native from 'natives';

// Access the core API
const core = (globalThis as any).core;

// Webviews
let webview: alt.WebView | null = null;
let debugWebview: alt.WebView | null = null;
let uiVisible = false;
let debugVisible = false;

/**
 * Initialize the client-side plugin
 */
function init(): void {
  if (!core) {
    alt.logError('[EXAMPLE] Core API not found!');
    return;
  }

  core.log('Example plugin client-side initialized! (Hot reload test)');

  // Register event handlers
  registerEventHandlers();

  // Register key bindings
  registerKeyBindings();
}

/**
 * Register event handlers for the plugin
 */
function registerEventHandlers(): void {
  // Listen for notification events from the server
  alt.onServer('example:notification', showNotification);

  // Listen for weapon giving events from the server
  alt.onServer('example:giveWeapons', giveWeapons);

  // Listen for hot reload events from the core
  core.on('core:hotReload', (pluginId: string) => {
    core.log(`Hot reload triggered for plugin: ${pluginId}`);
  });
}

/**
 * Register key bindings for the plugin
 */
function registerKeyBindings(): void {
  // Register a key binding to toggle the UI (F2 key)
  alt.on('keyup', (key: number) => {
    // Key code 113 is F2
    if (key === 113) {
      toggleUI();
    }

    // F3 key (114) to heal
    if (key === 114) {
      healPlayer();
    }

    // F4 key (115) to show debug webview
    if (key === 115) {
      toggleDebugUI();
    }
  });
}
/**
 * Toggle the UI visibility
 */
function toggleUI(): void {
  if (uiVisible) {
    closeUI();
  } else {
    showUI();
  }
}

/**
 * Show the UI
 */
function showUI(): void {
  if (webview) return;

  try {
    // Log the attempt to create a webview
    core.log(
      'Attempting to create WebView at: http://resource/client/html/index.html'
    );

    // Create a new webview with improved error handling
    webview = new alt.WebView('http://resource/client/html/index.html');

    if (!webview) {
      core.log('WebView creation failed - webview is null', 'error');
      return;
    }

    // Handle events from the webview
    webview.on('closeUI', () => {
      core.log('Received closeUI event from WebView');
      closeUI();
    });

    // Listen for UI ready event
    webview.on('uiReady', () => {
      core.log('UI is ready - received uiReady event');

      // Send player name to the WebView
      const localPlayer = alt.Player.local;
      if (localPlayer) {
        core.log(`Sending player info to WebView: ${localPlayer.name}`);
        webview?.emit('updatePlayerInfo', localPlayer.name);
      } else {
        core.log('Could not get local player info', 'warn');
      }
    });

    // Add error event handler
    webview.on('error', (errorMessage: string) => {
      core.log(`WebView error event: ${errorMessage}`, 'error');
    });

    // Toggle cursor and make it visible when the UI is open
    alt.showCursor(true);
    native.displayRadar(false);

    uiVisible = true;
    core.log('UI opened successfully');
  } catch (error) {
    core.log(`Error creating WebView: ${error}`, 'error');
    if (error instanceof Error && error.stack) {
      core.log(`Error stack: ${error.stack}`, 'error');
    }
  }
}

/**
 * Close the UI
 */
function closeUI(): void {
  if (!webview) {
    core.log('Attempted to close UI but webview is null', 'warn');
    return;
  }

  // Clean up the webview
  try {
    core.log('Destroying WebView');
    webview.destroy();
    core.log('WebView destroyed successfully');
  } catch (error) {
    core.log(`Error destroying WebView: ${error}`, 'error');
    if (error instanceof Error && error.stack) {
      core.log(`Error stack: ${error.stack}`, 'error');
    }
  }
  webview = null;

  // Hide the cursor and restore the radar
  alt.showCursor(false);
  native.displayRadar(true);

  uiVisible = false;
  core.log('UI closed successfully');
}

/**
 * Show a notification to the player
 * @param message The message to show
 */
function showNotification(message: string): void {
  // Use GTA native notification system
  native.beginTextCommandThefeedPost('STRING');
  native.addTextComponentSubstringPlayerName(message);
  native.endTextCommandThefeedPostTicker(false, true);

  core.log(`Notification: ${message}`);
}

/**
 * Give weapons to the player
 */
function giveWeapons(): void {
  core.log('Giving weapons to player');

  try {
    const player = alt.Player.local;
    if (player) {
      // Basic weapons
      native.giveWeaponToPed(player.scriptID, 0x1b06d571, 500, false, true); // Pistol
      native.giveWeaponToPed(player.scriptID, 0x13532244, 500, false, false); // Micro SMG
      native.giveWeaponToPed(player.scriptID, 0xa284510b, 500, false, false); // SMG

      // Set player health and armor to max
      native.setEntityHealth(player.scriptID, 200, 0, 0);
      native.setPedArmour(player.scriptID, 100);

      showNotification('Weapons given!');
    }
  } catch (error) {
    core.log(`Error giving weapons: ${error}`, 'error');
  }
}

/**
 * Heal the player
 */
function healPlayer(): void {
  try {
    const player = alt.Player.local;
    if (player) {
      // Heal player
      native.setEntityHealth(player.scriptID, 200, 0, 0);
      native.setPedArmour(player.scriptID, 100);

      // Small effect to show healing
      native.setEntityVelocity(player.scriptID, 0, 0, 0.2);

      showNotification('Health and armor restored!');
    }
  } catch (error) {
    core.log(`Error healing player: ${error}`, 'error');
  }
}

/**
 * Toggle the debug UI visibility
 */
function toggleDebugUI(): void {
  if (debugVisible) {
    closeDebugUI();
  } else {
    showDebugUI();
  }
}

/**
 * Show the debug UI
 */
function showDebugUI(): void {
  if (debugWebview) return;

  try {
    // Log the attempt to create a debug webview
    core.log(
      'Attempting to create Debug WebView at: http://resource/client/html/debug.html'
    );

    // Create a new debug webview
    debugWebview = new alt.WebView('http://resource/client/html/debug.html');

    if (!debugWebview) {
      core.log('Debug WebView creation failed - webview is null', 'error');
      return;
    }

    // Handle events from the debug webview
    debugWebview.on('closeDebug', () => {
      core.log('Received closeDebug event from Debug WebView');
      closeDebugUI();
    });

    // Listen for debug ready event
    debugWebview.on('debugReady', () => {
      core.log('Debug UI is ready - received debugReady event');

      // Send test data to the debug webview
      debugWebview?.emit('debugTest', 'Test data from client');
    });

    // Listen for test event
    debugWebview.on('testDebug', (message: string) => {
      core.log(`Received testDebug event from Debug WebView: ${message}`);

      // Send a notification
      showNotification(`Debug WebView: ${message}`);
    });

    // Toggle cursor and make it visible when the debug UI is open
    alt.showCursor(true);

    debugVisible = true;
    core.log('Debug UI opened successfully');
    showNotification('Debug UI opened (F4)');
  } catch (error) {
    core.log(`Error creating Debug WebView: ${error}`, 'error');
    if (error instanceof Error && error.stack) {
      core.log(`Error stack: ${error.stack}`, 'error');
    }
  }
}

/**
 * Close the debug UI
 */
function closeDebugUI(): void {
  if (!debugWebview) {
    core.log('Attempted to close Debug UI but webview is null', 'warn');
    return;
  }

  // Clean up the debug webview
  try {
    core.log('Destroying Debug WebView');
    debugWebview.destroy();
    core.log('Debug WebView destroyed successfully');
  } catch (error) {
    core.log(`Error destroying Debug WebView: ${error}`, 'error');
    if (error instanceof Error && error.stack) {
      core.log(`Error stack: ${error.stack}`, 'error');
    }
  }
  debugWebview = null;

  // Only hide cursor if the main UI is not visible
  if (!uiVisible) {
    alt.showCursor(false);
  }

  debugVisible = false;
  core.log('Debug UI closed successfully');
  showNotification('Debug UI closed');
}

// Initialize the plugin
init();

console.log('Client-side initialized! (Hot reload working!)');
