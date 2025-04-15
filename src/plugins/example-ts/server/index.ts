/**
 * Example plugin server-side entry point
 * This demonstrates how to use the core resource API
 */

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
  id: 'example-ts',
  name: 'Example TypeScript Plugin',
  version: '1.0.0',
  author: 'AltDragon',
  description:
    'An example plugin that demonstrates how to use the core resource',
  dependencies: ['core'],
  supportsHotReload: true,
};

// Plugin lifecycle hooks
const lifecycle: PluginLifecycle = {
  onLoad: () => {
    core.log('Example plugin loaded!');

    // Register event handlers
    registerEventHandlers();

    // Register chat commands
    registerChatCommands();
  },

  onUnload: () => {
    core.log('Example plugin unloaded!');
  },

  onReload: () => {
    core.log('Example plugin reloaded!');
  },

  onDependencyReload: (dependencyId) => {
    core.log(`Dependency ${dependencyId} was reloaded`);
  },
};

/**
 * Register event handlers for the plugin
 */
function registerEventHandlers(): void {
  // Listen for player connect events
  alt.on('playerConnect', handlePlayerConnect);

  // Listen for player disconnect events
  alt.on('playerDisconnect', handlePlayerDisconnect);

  // Listen for core events
  core.on('core:hotReload:complete', () => {
    core.log('Hot reload completed!');
  });
}

/**
 * Register chat commands for the plugin
 */
function registerChatCommands(): void {
  alt.on('chat:message', (player, message) => {
    // Example command
    if (message.startsWith('/example')) {
      player.sendNotification('Example command executed!');
      return;
    }

    // Vehicle spawn command
    if (message.startsWith('/vehicle') || message.startsWith('/veh')) {
      const args = message.split(' ');
      let vehicleName = 'adder'; // Default vehicle

      if (args.length >= 2) {
        vehicleName = args[1].toLowerCase();
      }

      spawnVehicle(player, vehicleName);
      return;
    }
  });
}

/**
 * Handle player connect events
 * @param player The player that connected
 */
function handlePlayerConnect(player: alt.Player): void {
  core.log(`Player connected: ${player.name}`);

  // Spawn the player
  spawnPlayer(player);
}

/**
 * Handle player disconnect events
 * @param player The player that disconnected
 * @param reason The reason for disconnection
 */
function handlePlayerDisconnect(player: alt.Player, reason: string): void {
  core.log(`Player disconnected: ${player.name}, Reason: ${reason}`);
}

/**
 * Spawn a player at a random location
 * @param player The player to spawn
 */
function spawnPlayer(player: alt.Player): void {
  // Spawn positions - variety of nice locations
  const spawnPositions = [
    { x: -1042.4601, y: -2745.4338, z: 21.3594 }, // Airport
    { x: 80.4588, y: -1966.2541, z: 21.0369 }, // Grove Street
    { x: -74.9482, y: -818.4858, z: 326.1745 }, // Maze Bank Tower top
    { x: -1377.626, y: -2848.8601, z: 13.9455 }, // Beach
    { x: 190.5618, y: -934.0596, z: 30.6866 }, // Legion Square
  ];

  // Select a random spawn position
  const spawnPos =
    spawnPositions[Math.floor(Math.random() * spawnPositions.length)];

  try {
    // Set player model
    player.model = 'mp_m_freemode_01';

    // Set player position with a small delay to ensure model is loaded
    alt.setTimeout(() => {
      try {
        // Set position and spawn
        player.spawn(spawnPos.x, spawnPos.y, spawnPos.z, 0);

        // Ensure player is fully spawned before giving weapons
        alt.setTimeout(() => {
          // Example of giving the player some basic weapons
          alt.emitClient(player, 'example:giveWeapons');

          sendNotification(
            player,
            `Welcome to the server, ${player.name}! Press F2 or type /ui to toggle the UI`
          );
          core.log(
            `Player ${player.name} spawned at ${spawnPos.x}, ${spawnPos.y}, ${spawnPos.z}`
          );
        }, 1000);
      } catch (error) {
        core.log(`Failed to spawn player ${player.name}: ${error}`, 'error');
      }
    }, 500);
  } catch (error) {
    core.log(`Failed to set up player ${player.name}: ${error}`, 'error');
  }
}

/**
 * Spawn a vehicle for a player
 * @param player The player to spawn the vehicle for
 * @param vehicleName The name of the vehicle to spawn
 */
function spawnVehicle(player: alt.Player, vehicleName: string): void {
  try {
    // Get player position and rotation
    const pos = player.pos;
    const rot = player.rot;

    // Spawn vehicle 2 meters in front of the player
    const forwardVector = {
      x: Math.sin((-rot.z * Math.PI) / 180) * 4,
      y: Math.cos((-rot.z * Math.PI) / 180) * 4,
      z: 0,
    };

    const spawnPos = {
      x: pos.x + forwardVector.x,
      y: pos.y + forwardVector.y,
      z: pos.z,
    };

    // Create the vehicle
    const vehicle = new alt.Vehicle(
      vehicleName,
      spawnPos.x,
      spawnPos.y,
      spawnPos.z,
      0,
      0,
      rot.z
    );

    // Check if vehicle was created successfully
    if (vehicle) {
      core.log(`Spawned vehicle ${vehicleName} for player ${player.name}`);
      sendNotification(player, `Vehicle ${vehicleName} spawned!`);

      // Set engine on and customize the vehicle
      vehicle.engineOn = true;
      vehicle.numberPlateText = 'ALTV';
      vehicle.primaryColor = Math.floor(Math.random() * 159);
      vehicle.secondaryColor = Math.floor(Math.random() * 159);
    } else {
      sendNotification(player, `Failed to spawn vehicle: ${vehicleName}`);
    }
  } catch (error) {
    core.log(`Error spawning vehicle: ${error}`, 'error');
    sendNotification(player, `Failed to spawn vehicle: ${error}`);
  }
}

/**
 * Send a notification to a player
 * @param player The player to send the notification to
 * @param message The message to send
 */
function sendNotification(player: alt.Player, message: string): void {
  try {
    alt.emitClient(player, 'example:notification', message);
  } catch (error) {
    core.log(`Failed to send notification: ${error}`, 'error');
  }
}

// Register the plugin with the core resource
core.registerPlugin(metadata, lifecycle);
