/**
 * Client-side plugin loader for the core resource
 * This file is responsible for loading all client-side plugins
 */

import * as alt from 'alt-client';
import * as native from 'natives';

/**
 * Initialize the client-side plugin loader
 * This is called when the core resource starts on the client side
 */
export function initPluginLoader(): void {
  alt.log('~lb~[CORE:CLIENT]~w~ Initializing client-side plugin loader');

  // Load all plugins
  loadAllPlugins();

  alt.log('~lg~[CORE:CLIENT]~w~ Client-side plugin loader initialized');
}

/**
 * Load all client-side plugins
 */
function loadAllPlugins(): void {
  alt.log('~lb~[CORE:CLIENT]~w~ Loading all client-side plugins');

  // We'll use a different approach for client-side plugins
  // Instead of trying to dynamically import them, we'll register event handlers
  // that will be triggered by the server when a player connects

  // Register event handlers for plugin initialization
  alt.onServer('plugin:init', (pluginId: string) => {
    alt.log(`~lb~[CORE:CLIENT]~w~ Initializing plugin: ${pluginId}`);

    // Emit an event that the plugin can listen for
    const core = (globalThis as any).core;
    if (core) {
      core.emit(`plugin:${pluginId}:init`);
      alt.log(`~lg~[CORE:CLIENT]~w~ Plugin ${pluginId} initialized`);
    } else {
      alt.logError(
        `[CORE:CLIENT] Core API not available for plugin ${pluginId}`
      );
    }
  });

  // Register event handlers for plugin reloading
  alt.onServer('plugin:reload', (pluginId: string) => {
    alt.log(`~lb~[CORE:CLIENT]~w~ Reloading plugin: ${pluginId}`);

    // Emit an event that the plugin can listen for
    const core = (globalThis as any).core;
    if (core) {
      core.emit(`plugin:${pluginId}:reload`);
      alt.log(`~lg~[CORE:CLIENT]~w~ Plugin ${pluginId} reloaded`);
    } else {
      alt.logError(
        `[CORE:CLIENT] Core API not available for plugin ${pluginId}`
      );
    }
  });

  // Register event handlers for specific plugins
  registerExampleTsPlugin();
  registerExampleHtmlPlugin();

  alt.log('~lg~[CORE:CLIENT]~w~ All client-side plugins registered');
}

/**
 * Register the example-ts plugin
 */
function registerExampleTsPlugin(): void {
  const pluginId = 'example-ts';
  alt.log(`~lb~[CORE:CLIENT]~w~ Registering plugin: ${pluginId}`);

  // Get the core API
  const core = (globalThis as any).core;
  if (!core) {
    alt.logError(`[CORE:CLIENT] Core API not available for plugin ${pluginId}`);
    return;
  }

  // Register event handlers
  core.on(`plugin:${pluginId}:init`, () => {
    alt.log(`~lb~[CORE:CLIENT]~w~ Initializing ${pluginId} plugin`);

    // Register event handlers
    alt.onServer('example:notification', showNotification);
    alt.onServer('example:giveWeapons', giveWeapons);

    // Register key bindings
    alt.on('keyup', handleKeyUp);

    alt.log(`~lg~[CORE:CLIENT]~w~ ${pluginId} plugin initialized`);
  });

  // Register reload handler
  core.on(`plugin:${pluginId}:reload`, () => {
    alt.log(`~lb~[CORE:CLIENT]~w~ Reloading ${pluginId} plugin`);

    // Close UI if it's open
    if (uiVisible) {
      closeUI();
    }

    // Re-register event handlers
    alt.onServer('example:notification', showNotification);
    alt.onServer('example:giveWeapons', giveWeapons);

    alt.log(`~lg~[CORE:CLIENT]~w~ ${pluginId} plugin reloaded`);
  });
}

/**
 * Register the example-html plugin
 */
function registerExampleHtmlPlugin(): void {
  const pluginId = 'example-html';
  alt.log(`~lb~[CORE:CLIENT]~w~ Registering plugin: ${pluginId}`);

  // Get the core API
  const core = (globalThis as any).core;
  if (!core) {
    alt.logError(`[CORE:CLIENT] Core API not available for plugin ${pluginId}`);
    return;
  }

  // Register event handlers
  core.on(`plugin:${pluginId}:init`, () => {
    alt.log(`~lb~[CORE:CLIENT]~w~ Initializing ${pluginId} plugin`);

    // Register event handlers
    alt.onServer('example:notification', showNotification);
    alt.onServer('example:toggleUI', toggleHtmlUI);

    alt.log(`~lg~[CORE:CLIENT]~w~ ${pluginId} plugin initialized`);
  });

  // Register reload handler
  core.on(`plugin:${pluginId}:reload`, () => {
    alt.log(`~lb~[CORE:CLIENT]~w~ Reloading ${pluginId} plugin`);

    // Close UI if it's open
    if (htmlUiVisible) {
      closeHtmlUI();
    }

    // Re-register event handlers
    alt.onServer('example:notification', showNotification);
    alt.onServer('example:toggleUI', toggleHtmlUI);

    alt.log(`~lg~[CORE:CLIENT]~w~ ${pluginId} plugin reloaded`);
  });
}

// Shared functions used by plugins

/**
 * Show a notification to the player
 * @param message The message to show
 */
function showNotification(message: string): void {
  const core = (globalThis as any).core;
  if (!core) return;

  core.log(`Showing notification: ${message}`);

  try {
    // Use native GTA V notification system
    // Clear previous notifications
    native.clearAllHelpMessages();

    // Show notification
    native.beginTextCommandDisplayHelp('STRING');
    native.addTextComponentSubstringPlayerName(message);
    native.endTextCommandDisplayHelp(0, false, true, -1);

    // Also show a notification above the map
    native.beginTextCommandThefeedPost('STRING');
    native.addTextComponentSubstringPlayerName(message);
    native.endTextCommandThefeedPostTicker(true, true);
  } catch (error) {
    core.log(`Error showing notification: ${error}`, 'error');
    // Fallback to console log if natives not available
    alt.log(`~lg~[NOTIFICATION]~w~ ${message}`);
  }
}

/**
 * Give weapons to the player
 */
function giveWeapons(): void {
  const core = (globalThis as any).core;
  if (!core) return;

  core.log('Giving weapons to player');

  try {
    const player = alt.Player.local;

    if (player) {
      // Give some weapons
      native.giveWeaponToPed(player.scriptID, 453432689, 500, false, true); // Pistol
      native.giveWeaponToPed(player.scriptID, 324215364, 500, false, false); // Micro SMG
      native.giveWeaponToPed(player.scriptID, 2726580491, 500, false, false); // Grenade Launcher

      // Set health and armor
      native.setEntityHealth(player.scriptID, 200, 0, 0);
      native.setPedArmour(player.scriptID, 100);

      // Make sure the player has the weapons
      native.setCurrentPedWeapon(player.scriptID, 453432689, true); // Switch to pistol

      showNotification('Weapons given!');
    }
  } catch (error) {
    core.log(`Error giving weapons: ${error}`, 'error');
  }
}

// WebView for example-ts plugin
let webview: alt.WebView | null = null;
let uiVisible = false;

/**
 * Handle key up events
 * @param key The key code
 */
function handleKeyUp(key: number): void {
  const core = (globalThis as any).core;
  if (!core) return;

  // Shift+2 to toggle UI
  if (key === 50 && alt.isKeyDown(16)) {
    core.log('Shift+2 pressed, toggling UI');
    toggleUI();
  }
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

  const core = (globalThis as any).core;
  if (!core) return;

  try {
    core.log(
      'Attempting to create WebView at: http://resource/client/html/index.html'
    );

    webview = new alt.WebView('http://resource/client/html/index.html');

    if (!webview) {
      core.log('WebView creation failed - webview is null', 'error');
      return;
    }

    webview.on('closeUI', () => {
      core.log('Received closeUI event from WebView');
      closeUI();
    });

    webview.on('uiReady', () => {
      core.log('UI is ready - received uiReady event');

      const localPlayer = alt.Player.local;
      if (localPlayer) {
        core.log(`Sending player info to WebView: ${localPlayer.name}`);
        webview?.emit('updatePlayerInfo', localPlayer.name);
      } else {
        core.log('Could not get local player info', 'warn');
      }
    });

    // Show cursor
    alt.showCursor(true);

    // Set focus to game
    alt.toggleGameControls(false);

    uiVisible = true;
    core.log('UI shown successfully');
  } catch (error) {
    core.log(`Error showing UI: ${error}`, 'error');
  }
}

/**
 * Close the UI
 */
function closeUI(): void {
  const core = (globalThis as any).core;
  if (!core) return;

  try {
    if (webview) {
      webview.destroy();
      webview = null;

      // Hide cursor
      alt.showCursor(false);

      // Restore game controls
      alt.toggleGameControls(true);

      uiVisible = false;
      core.log('UI closed successfully');
    }
  } catch (error) {
    core.log(`Error closing UI: ${error}`, 'error');
  }
}

// WebView for example-html plugin
let htmlWebview: alt.WebView | null = null;
let htmlUiVisible = false;

/**
 * Toggle the HTML UI visibility
 */
function toggleHtmlUI(): void {
  if (htmlUiVisible) {
    closeHtmlUI();
  } else {
    showHtmlUI();
  }
}

/**
 * Show the HTML UI
 */
function showHtmlUI(): void {
  if (htmlWebview) return;

  const core = (globalThis as any).core;
  if (!core) return;

  try {
    core.log(
      'Attempting to create HTML WebView at: http://resource/client/html/ui.html'
    );

    htmlWebview = new alt.WebView('http://resource/client/html/ui.html');

    if (!htmlWebview) {
      core.log('HTML WebView creation failed - webview is null', 'error');
      return;
    }

    htmlWebview.on('ui:close', () => {
      core.log('Received ui:close event from HTML WebView');
      closeHtmlUI();
    });

    htmlWebview.on('ui:action', (action: string, ...args: any[]) => {
      core.log(`UI action: ${action}, args: ${JSON.stringify(args)}`);

      // Handle different actions
      switch (action) {
        case 'teleport':
          if (args.length >= 3) {
            const [x, y, z] = args;
            try {
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
              showNotification(`Teleported to ${x}, ${y}, ${z}`);
            } catch (error) {
              core.log(`Error teleporting: ${error}`, 'error');
            }
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

    // Show cursor
    alt.showCursor(true);

    // Set focus to game
    alt.toggleGameControls(false);

    htmlUiVisible = true;
    core.log('HTML UI shown successfully');
  } catch (error) {
    core.log(`Error showing HTML UI: ${error}`, 'error');
  }
}

/**
 * Close the HTML UI
 */
function closeHtmlUI(): void {
  const core = (globalThis as any).core;
  if (!core) return;

  try {
    if (htmlWebview) {
      htmlWebview.destroy();
      htmlWebview = null;

      // Hide cursor
      alt.showCursor(false);

      // Restore game controls
      alt.toggleGameControls(true);

      htmlUiVisible = false;
      core.log('HTML UI closed successfully');
    }
  } catch (error) {
    core.log(`Error closing HTML UI: ${error}`, 'error');
  }
}
