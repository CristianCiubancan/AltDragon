/**
 * Example plugin client-side entry point
 * This demonstrates how to use the core resource API on the client side
 */

import * as alt from 'alt-client';
import * as native from 'natives';

// Access the core API
const core = (window as any).core;

// Webview for UI
let webview: alt.WebView | null = null;
let uiVisible = false;

/**
 * Initialize the client-side plugin
 */
function init(): void {
  if (!core) {
    alt.logError('[EXAMPLE] Core API not found!');
    return;
  }
  
  core.log('Example plugin client-side initialized!');
  
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
    // Create a new webview
    webview = new alt.WebView('http://resource/client/html/index.html');
    
    // Handle events from the webview
    webview.on('closeUI', () => {
      closeUI();
    });
    
    // Listen for UI ready event
    webview.on('uiReady', () => {
      alt.log('UI is ready');
      
      // Send player name to the WebView
      const localPlayer = alt.Player.local;
      if (localPlayer) {
        webview.emit('updatePlayerInfo', localPlayer.name);
      }
    });
    
    // Toggle cursor and make it visible when the UI is open
    alt.showCursor(true);
    native.displayRadar(false);
    
    uiVisible = true;
    core.log('UI opened');
  } catch (error) {
    core.log(`Error creating WebView: ${error}`, 'error');
  }
}

/**
 * Close the UI
 */
function closeUI(): void {
  if (!webview) return;
  
  // Clean up the webview
  try {
    webview.destroy();
  } catch (error) {
    core.log(`Error destroying WebView: ${error}`, 'error');
  }
  webview = null;
  
  // Hide the cursor and restore the radar
  alt.showCursor(false);
  native.displayRadar(true);
  
  uiVisible = false;
  core.log('UI closed');
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

// Initialize the plugin
init();
