/**
 * Example plugin with HTML UI - Server-side entry point
 */

import * as alt from 'alt-server';

// Access the core API
const core = (global as any).core;

// Plugin metadata
const metadata = {
  id: 'example-html',
  name: 'Example HTML Plugin',
  version: '1.0.0',
  author: 'AltDragon',
  description: 'An example plugin that demonstrates HTML UI',
  dependencies: ['core'],
  supportsHotReload: true,
};

// Plugin lifecycle hooks
const lifecycle = {
  onLoad: () => {
    core.log('Example HTML plugin loaded!');

    // Register event handlers
    registerEventHandlers();

    // Register chat commands
    registerChatCommands();
  },

  onUnload: () => {
    core.log('Example HTML plugin unloaded!');
  },

  onReload: () => {
    core.log('Example HTML plugin reloaded!');
  },

  onDependencyReload: (dependencyId: string) => {
    core.log(`Dependency ${dependencyId} was reloaded`);
  },
};

/**
 * Register event handlers
 */
function registerEventHandlers() {
  alt.on('playerConnect', handlePlayerConnect);
  alt.on('playerDisconnect', handlePlayerDisconnect);
}

/**
 * Register chat commands
 */
function registerChatCommands() {
  core.registerChatCommand('ui', (player: alt.Player) => {
    // Toggle the UI for the player
    alt.emitClient(player, 'example:toggleUI');
    core.log(`Toggled UI for player ${player.name}`);
  });
}

/**
 * Handle player connect event
 * @param player The player that connected
 */
function handlePlayerConnect(player: alt.Player) {
  core.log(`Player connected: ${player.name}`);
  
  // Spawn the player
  player.spawn(0, 0, 72);
  
  // Set player health and armor
  player.health = 100;
  player.armor = 100;
  
  // Send welcome message
  alt.emitClient(player, 'example:notification', 'Welcome to the server!');
}

/**
 * Handle player disconnect event
 * @param player The player that disconnected
 * @param reason The reason for disconnection
 */
function handlePlayerDisconnect(player: alt.Player, reason: string) {
  core.log(`Player disconnected: ${player.name} (${reason})`);
}

// Register the plugin with the core
if (core && core.registerPlugin) {
  core.registerPlugin(metadata, lifecycle);
} else {
  alt.logError('[EXAMPLE-HTML] Failed to register plugin: Core API not found');
}
