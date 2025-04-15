/**
 * Core resource server entry point
 * This is the main entry point for the core resource on the server side
 */

import * as alt from 'alt-server';
import { initPluginManager } from './plugin-manager.js';
import {
  initPluginLoader,
  getPluginIds,
  getPluginMetadata,
} from './plugin-loader.js';

// Core resource metadata
const CORE_VERSION = '1.0.0';

/**
 * Initialize the core resource
 * This is called when the resource starts
 */
function initCore(): void {
  alt.log('~lb~=================================~w~');
  alt.log('~lb~[CORE]~w~ Initializing core resource v' + CORE_VERSION);

  // Initialize the plugin manager
  initPluginManager();

  // Initialize the plugin loader
  initPluginLoader();

  // Register event handlers
  registerEventHandlers();

  alt.log('~lg~[CORE]~w~ Core resource initialized successfully');
  alt.log('~lb~=================================~w~');
}

/**
 * Register event handlers for the core resource
 */
function registerEventHandlers(): void {
  // Listen for player connect events
  alt.on('playerConnect', handlePlayerConnect);

  // Listen for resource start/stop events
  alt.on('anyResourceStart', handleResourceStart);
  alt.on('anyResourceStop', handleResourceStop);

  // Register console commands
  alt.on('consoleCommand', handleConsoleCommand);
}

/**
 * Handle player connect events
 * @param player The player that connected
 */
function handlePlayerConnect(player: alt.Player): void {
  alt.log(`~lg~[CORE]~w~ Player connected: ${player.name}`);

  // Emit client-side event to initialize the core
  alt.emitClient(player, 'core:init');

  // Initialize client-side plugins
  initClientPlugins(player);

  // Spawn the player
  spawnPlayer(player);
}

/**
 * Initialize client-side plugins for a player
 * @param player The player to initialize plugins for
 */
function initClientPlugins(player: alt.Player): void {
  alt.log(`~lb~[CORE]~w~ Initializing client-side plugins for ${player.name}`);

  // Get all plugin IDs from the plugin loader
  const pluginIds = getPluginIds();

  // Initialize each plugin
  for (const pluginId of pluginIds) {
    alt.log(
      `~lb~[CORE]~w~ Initializing client-side plugin ${pluginId} for ${player.name}`
    );
    alt.emitClient(player, 'plugin:init', pluginId);
  }

  alt.log(`~lg~[CORE]~w~ Client-side plugins initialized for ${player.name}`);
}

/**
 * Spawn a player at a specific location
 * @param player The player to spawn
 */
function spawnPlayer(player: alt.Player): void {
  // Fixed spawn position - Mount Chiliad
  const spawnPos = { x: 501.9261, y: 5604.3647, z: 797.9105 }; // Mount Chiliad peak

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
            `Welcome to the server, ${player.name}! Press Shift+2 to toggle the UI`
          );
          alt.log(
            `~lg~[CORE]~w~ Player ${player.name} spawned at Mount Chiliad (${spawnPos.x}, ${spawnPos.y}, ${spawnPos.z})`
          );
        }, 1000);
      } catch (error) {
        alt.log(
          `~lr~[CORE]~w~ Failed to spawn player ${player.name}: ${error}`
        );
      }
    }, 500);
  } catch (error) {
    alt.log(`~lr~[CORE]~w~ Failed to set up player ${player.name}: ${error}`);
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
    alt.log(`~lr~[CORE]~w~ Failed to send notification: ${error}`);
  }
}

/**
 * Handle resource start events
 * @param resourceName The name of the resource that started
 */
function handleResourceStart(resourceName: string): void {
  // Skip if it's the core resource
  if (resourceName === 'core') {
    return;
  }

  alt.log(`~lb~[CORE]~w~ Resource started: ${resourceName}`);
}

/**
 * Handle resource stop events
 * @param resourceName The name of the resource that stopped
 */
function handleResourceStop(resourceName: string): void {
  // Skip if it's the core resource
  if (resourceName === 'core') {
    return;
  }

  alt.log(`~ly~[CORE]~w~ Resource stopped: ${resourceName}`);
}

/**
 * Handle console commands
 * @param command The command that was entered
 * @param args The arguments for the command
 */
function handleConsoleCommand(command: string, ...args: string[]): void {
  // Handle core-specific commands
  switch (command.toLowerCase()) {
    case 'core:version':
      alt.log(`~lb~[CORE]~w~ Version: ${CORE_VERSION}`);
      break;

    case 'core:plugins':
      // List all registered plugins
      const pluginIds = getPluginIds();
      alt.log(`~lb~[CORE]~w~ Found ${pluginIds.length} plugins:`);

      for (const pluginId of pluginIds) {
        const metadata = getPluginMetadata(pluginId);
        if (metadata) {
          alt.log(
            `~lb~[CORE]~w~ - ${metadata.name} (${metadata.id}) v${metadata.version} by ${metadata.author}`
          );
          alt.log(`~lb~[CORE]~w~   ${metadata.description}`);
        } else {
          alt.log(`~lb~[CORE]~w~ - ${pluginId} (No metadata available)`);
        }
      }
      break;

    case 'core:reload':
      if (args.length > 0) {
        const pluginId = args[0];
        alt.log(`~lb~[CORE]~w~ Manually reloading plugin: ${pluginId}`);
        // Emit reload event to all clients
        alt.emitAllClients('plugin:reload', pluginId);
      } else {
        alt.log('~lr~[CORE]~w~ Usage: core:reload <pluginId>');
      }
      break;
  }
}

// Initialize the core resource
initCore();
