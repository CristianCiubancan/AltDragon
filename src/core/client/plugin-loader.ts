/**
 * Client-side plugin loader for the core resource
 * This file is responsible for loading all client-side plugins
 */

import * as alt from 'alt-client';
import * as native from 'natives';

// Interface for plugin registration
interface RegisteredPlugin {
  id: string;
  hasHTML: boolean;
  htmlFiles: string[]; // Array of HTML paths to load
}

// Track registered plugins with their HTML paths
const registeredPlugins = new Map<string, RegisteredPlugin>();

// Helper function to get the WebView URL for a plugin HTML file
function getPluginHtmlUrl(pluginId: string, filename: string): string {
  // For plugins bundled in the core (old style, deprecated)
  const oldStyleUrl = `http://resource/plugins/${pluginId}/client/html/${filename}`;
  
  // For plugins as separate resources (new style, recommended)
  // Use http://resource/<resourceName> format which is the standard alt:V format
  const newStyleUrl = `http://resource/${pluginId}/client/html/${filename}`;
  
  // Try to determine if this is a standalone resource or bundled plugin
  const isStandaloneResource = true; // We now always build plugins as separate resources
  
  return isStandaloneResource ? newStyleUrl : oldStyleUrl;
}

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

  // Register plugin in the registry with HTML paths
  registeredPlugins.set(pluginId, { 
    id: pluginId, 
    hasHTML: true, 
    htmlFiles: [
      getPluginHtmlUrl(pluginId, 'index.html'),
      getPluginHtmlUrl(pluginId, 'debug.html')
    ]
  });

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
  
  // Register plugin in the registry with HTML paths
  registeredPlugins.set(pluginId, { 
    id: pluginId, 
    hasHTML: true, 
    htmlFiles: [
      getPluginHtmlUrl(pluginId, 'ui.html')
    ]
  });

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

// Store all active webviews 
let activeWebviews: alt.WebView[] = [];
let pluginUIVisible = false;

/**
 * Toggle HTML files from all plugins
 */
function toggleAllPluginsHTML(): void {
  const core = (globalThis as any).core;
  if (!core) return;
  
  // If UI is visible, close it
  if (pluginUIVisible) {
    closeAllPluginWebviews();
    return;
  }
  
  // Otherwise, load all plugin UIs
  core.log('Loading HTML files from all plugins');

  // Close any already open individual UIs first
  if (uiVisible) {
    closeUI();
  }
  
  if (htmlUiVisible) {
    closeHtmlUI();
  }
  
  // Clear the array of active webviews
  activeWebviews = [];
  let webviewsCreated = 0;

  // Loop through all registered plugins and create webviews for their HTML files
  registeredPlugins.forEach((plugin: RegisteredPlugin, pluginId: string) => {
    if (plugin.hasHTML && plugin.htmlFiles.length > 0) {
      // Loop through all HTML files for this plugin
      plugin.htmlFiles.forEach(htmlPath => {
        try {
          core.log(`Creating WebView for plugin ${pluginId} at: ${htmlPath}`);
          
          const webview = new alt.WebView(htmlPath);
        
          if (webview) {
            activeWebviews.push(webview);
            webviewsCreated++;
            
            // Add event listeners for closing
            webview.on('closeUI', () => {
              core.log(`Received closeUI event from WebView for plugin ${pluginId}`);
              closeAllPluginWebviews();
            });
            
            webview.on('ui:close', () => {
              core.log(`Received ui:close event from WebView for plugin ${pluginId}`);
              closeAllPluginWebviews();
            });
            
            core.log(`WebView created successfully for plugin ${pluginId}`);
          }
        } catch (error) {
          core.log(`Error creating WebView for plugin ${pluginId}: ${error}`, 'error');
        }
      });
    }
  });
  
  // Show cursor and disable game controls if any webviews were created
  if (webviewsCreated > 0) {
    alt.showCursor(true);
    alt.toggleGameControls(false);
    pluginUIVisible = true;
    core.log(`Created ${webviewsCreated} WebViews for plugin HTML files`);
  } else {
    core.log('No HTML files found in plugins', 'warn');
  }
}

/**
 * Close all plugin webviews
 */
function closeAllPluginWebviews(): void {
  const core = (globalThis as any).core;
  if (!core) return;
  
  try {
    // Destroy each webview
    activeWebviews.forEach(webview => {
      if (webview) {
        webview.destroy();
      }
    });
    
    // Clear the array
    activeWebviews = [];
    
    // Hide cursor and restore game controls
    alt.showCursor(false);
    alt.toggleGameControls(true);
    
    // Update visibility flag
    pluginUIVisible = false;
    
    core.log('All plugin WebViews closed');
  } catch (error) {
    core.log(`Error closing WebViews: ${error}`, 'error');
  }
}

/**
 * Handle key up events
 * @param key The key code
 */
function handleKeyUp(key: number): void {
  const core = (globalThis as any).core;
  if (!core) return;

  // Numpad 1 to toggle all plugin HTML files
  if (key === 97) {
    core.log('Numpad 1 pressed, toggling all plugin HTML files');
    toggleAllPluginsHTML();
    showNotification('HTML UI toggled (Numpad 1)');
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
    const htmlPath = getPluginHtmlUrl('example-html', 'ui.html');
    core.log(`Attempting to create HTML WebView at: ${htmlPath}`);

    htmlWebview = new alt.WebView(htmlPath);

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
