/**
 * Core resource server entry point
 * This is the main entry point for the core resource on the server side
 */

import * as alt from 'alt-server';
import { initPluginManager } from './plugin-manager.js';

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
      // This would list all registered plugins
      alt.log(`~lb~[CORE]~w~ Plugins: TODO`);
      break;
  }
}

// Initialize the core resource
initCore();
