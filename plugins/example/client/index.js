import * as alt from 'alt-client';
import * as native from 'natives';

let webview = null;
let uiVisible = false;
let connectionAttempts = 0;
const MAX_ATTEMPTS = 3;

alt.log('Example client-side resource started.');

// Alternative ways to load the UI, in case one fails
const UI_PATHS = [
  'http://resource/client/html/index.html',
  'http://localhost:7789/file/example/client/html/index.html',
  'http://127.0.0.1:7789/file/example/client/html/index.html',
];

// Register a key binding to toggle the UI (F2 key)
alt.on('keyup', (key) => {
  // Key code 113 is F2
  if (key === 113) {
    toggleUI();
  }
});

// Register a command handler for testing
alt.registerCmd('ui', () => {
  toggleUI();
});

function toggleUI() {
  if (uiVisible) {
    closeUI();
  } else {
    showUI();
  }
}

function showUI() {
  if (webview) return;

  // Reset connection attempts for each new UI show attempt
  connectionAttempts = 0;
  tryCreateWebView();

  // Toggle cursor and make it visible when the UI is open
  alt.showCursor(true);
  native.displayRadar(false);

  uiVisible = true;
  alt.log('UI opened');
}

function tryCreateWebView() {
  if (connectionAttempts >= MAX_ATTEMPTS) {
    alt.logError('Failed to create WebView after multiple attempts');
    return;
  }

  const pathIndex = connectionAttempts % UI_PATHS.length;
  const path = UI_PATHS[pathIndex];

  alt.log(
    `Attempt ${connectionAttempts + 1}: Creating WebView with path: ${path}`
  );

  try {
    // Create a new webview instance using one of the paths
    webview = new alt.WebView(path);

    // Handle events from the webview
    webview.on('closeUI', () => {
      closeUI();
    });

    // Add error event handler
    webview.on('error', (error) => {
      alt.logError(`WebView error: ${error}`);
      retryWebView();
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

    // Listen for pong response
    webview.on('pong', () => {
      alt.log('WebView connection successful (received pong)');
    });

    // Set a timeout to check if the WebView loaded correctly
    alt.setTimeout(() => {
      if (webview) {
        try {
          // Test if the WebView is responsive
          alt.log('Sending ping to test WebView connection');
          webview.emit('ping');
        } catch (error) {
          alt.logError('WebView timeout - retrying with another URL');
          retryWebView();
        }
      }
    }, 2000);
  } catch (error) {
    alt.logError(`Error creating WebView: ${error.message}`);
    retryWebView();
  }
}

function retryWebView() {
  // Cleanup existing WebView if it exists
  if (webview) {
    try {
      webview.destroy();
    } catch (error) {
      alt.logError(`Error destroying WebView: ${error.message}`);
    }
    webview = null;
  }

  // Increment attempts and try again
  connectionAttempts++;
  if (connectionAttempts < MAX_ATTEMPTS) {
    alt.log(
      `Retrying WebView creation (attempt ${
        connectionAttempts + 1
      }/${MAX_ATTEMPTS})`
    );
    alt.setTimeout(() => {
      tryCreateWebView();
    }, 500); // Small delay before retry
  } else {
    alt.logError('Failed to create WebView after maximum attempts');
  }
}

function closeUI() {
  if (!webview) return;

  // Clean up the webview
  try {
    webview.destroy();
  } catch (error) {
    alt.logError(`Error destroying WebView: ${error.message}`);
  }
  webview = null;

  // Hide the cursor and restore the radar
  alt.showCursor(false);
  native.displayRadar(true);

  uiVisible = false;
  alt.log('UI closed');
}

// Listen for server events
alt.onServer('example:showUI', showUI);
alt.onServer('example:closeUI', closeUI);

// Handle notifications
alt.onServer('example:notification', (message) => {
  alt.log(`Notification: ${message}`);

  try {
    // Display notification on screen
    native.beginTextCommandDisplayHelp('STRING');
    native.addTextComponentSubstringPlayerName(message);
    native.endTextCommandDisplayHelp(0, false, true, 5000);
  } catch (error) {
    alt.logError(`Error displaying notification: ${error.message}`);

    // Fallback notification using game notification system
    native.beginTextCommandThefeedPost('STRING');
    native.addTextComponentSubstringPlayerName(message);
    native.endTextCommandThefeedPostTicker(true, true);
  }
});

// Handle giving weapons to the player
alt.onServer('example:giveWeapons', () => {
  alt.log('Giving weapons to player');
  try {
    const player = alt.Player.local;
    if (player) {
      // Basic weapons
      native.giveWeaponToPed(player.scriptID, 0x1b06d571, 500, false, true); // Pistol
      native.giveWeaponToPed(player.scriptID, 0x13532244, 500, false, false); // Micro SMG
      native.giveWeaponToPed(player.scriptID, 0xa284510b, 500, false, false); // SMG

      // Remove weapon on pickup
      native.setPlayerCanLeaveParachuteSmokeTrail(player.scriptID, true);

      // Set player health and armor to max
      native.setEntityHealth(player.scriptID, 200, 0);
      native.setPedArmour(player.scriptID, 100);

      // Notify player
      alt.emit('notification', 'Weapons have been given to you!');
    }
  } catch (error) {
    alt.logError(`Error giving weapons: ${error.message}`);
  }
});

// Helper function for showing notifications
function showNotification(message) {
  try {
    native.beginTextCommandThefeedPost('STRING');
    native.addTextComponentSubstringPlayerName(message);
    native.endTextCommandThefeedPostTicker(true, true);
  } catch (error) {
    alt.logError(`Error showing notification: ${error.message}`);
  }
}

// Add additional keybind for testing - F3 key to heal
alt.on('keyup', (key) => {
  // F3 key (114)
  if (key === 114) {
    try {
      const player = alt.Player.local;
      if (player) {
        // Heal player
        native.setEntityHealth(player.scriptID, 200, 0);
        native.setPedArmour(player.scriptID, 100);

        // Small effect to show healing
        native.setEntityVelocity(player.scriptID, 0, 0, 0.2);

        showNotification('Health and armor restored!');
      }
    } catch (error) {
      alt.logError(`Error healing player: ${error.message}`);
    }
  }
});

// Add F4 key to teleport to different locations
alt.on('keyup', (key) => {
  // F4 key (115)
  if (key === 115) {
    try {
      const teleportLocations = [
        { x: -74.9482, y: -818.4858, z: 326.1745, name: 'Maze Bank Tower' },
        { x: 890.55, y: -2172.77, z: 32.28, name: 'Scrapyard' },
        { x: 1705.66, y: 3249.88, z: 41.27, name: 'Sandy Shores' },
        { x: -1277.59, y: -3036.77, z: 14.17, name: 'Airport Runway' },
        { x: -428.01, y: 1111.4, z: 326.76, name: 'Mount Chiliad' },
      ];

      const randomLocation =
        teleportLocations[Math.floor(Math.random() * teleportLocations.length)];
      const player = alt.Player.local;

      if (player) {
        // Get vehicle if player is in one
        let vehicle = null;
        if (native.isPedInAnyVehicle(player.scriptID, false)) {
          vehicle = native.getVehiclePedIsIn(player.scriptID, false);
        }

        if (vehicle) {
          // Teleport vehicle
          native.setEntityCoords(
            vehicle,
            randomLocation.x,
            randomLocation.y,
            randomLocation.z,
            false,
            false,
            false,
            true
          );
        } else {
          // Teleport player
          native.setEntityCoords(
            player.scriptID,
            randomLocation.x,
            randomLocation.y,
            randomLocation.z,
            false,
            false,
            false,
            true
          );
        }

        showNotification(`Teleported to ${randomLocation.name}!`);
      }
    } catch (error) {
      alt.logError(`Error teleporting player: ${error.message}`);
    }
  }
});
