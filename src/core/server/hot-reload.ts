/**
 * Hot reload system for the core resource
 * Uses esbuild to watch for file changes and trigger resource reloads
 */

import * as alt from 'alt-server';
import { HotReloadEvent } from '../shared/interfaces.js';

// Map to track resources that are currently being reloaded
const reloadingResources = new Map<string, number>();

// Event names
const RELOAD_START_EVENT = 'core:hotReload:start';
const RELOAD_COMPLETE_EVENT = 'core:hotReload:complete';
const RELOAD_FAILED_EVENT = 'core:hotReload:failed';

/**
 * Initialize the hot reload system
 * This is called when the core resource starts
 */
export function initHotReload(): void {
  alt.log('~lb~[CORE]~w~ Initializing hot reload system');

  // Listen for file change events from the build process
  alt.onClient('core:fileChanged', handleFileChanged);

  // Register command to manually trigger a reload
  alt.on('consoleCommand', (command: string, ...args: string[]) => {
    if (command === 'reload') {
      const resourceName = args[0] || 'all';
      if (resourceName === 'all') {
        reloadAllPlugins();
      } else {
        reloadPlugin(resourceName);
      }
    }
  });

  alt.log('~lg~[CORE]~w~ Hot reload system initialized');
}

/**
 * Handle a file change event
 * @param player The player that sent the event (should be null for system events)
 * @param filePath The path of the file that changed
 */
function handleFileChanged(player: alt.Player | null, filePath: string): void {
  if (player !== null) {
    // Only accept system events
    return;
  }

  alt.log(`~lb~[CORE]~w~ File changed: ${filePath}`);

  // Determine which resource needs to be reloaded based on the file path
  const resourceName = getResourceNameFromPath(filePath);
  if (!resourceName) {
    alt.log(`~lr~[CORE]~w~ Could not determine resource for file: ${filePath}`);
    return;
  }

  // Reload the resource
  reloadPlugin(resourceName);
}

/**
 * Get the resource name from a file path
 * @param filePath The path of the file
 * @returns The name of the resource, or null if it couldn't be determined
 */
function getResourceNameFromPath(filePath: string): string | null {
  // Extract resource name from path
  // This will depend on your project structure
  // For example: src/plugins/example/server/index.ts -> example

  // Normalize path separators to forward slashes for consistent matching
  const normalizedPath = filePath.replace(/\\/g, '/');

  // Match both patterns: src/plugins/name and src\plugins\name
  const match = normalizedPath.match(/src\/plugins\/([^\/]+)/);
  if (match && match[1]) {
    return match[1];
  }

  // Check if it's the core resource
  if (normalizedPath.includes('src/core/')) {
    return 'core';
  }

  return null;
}

/**
 * Reload a specific plugin
 * @param pluginId The ID of the plugin to reload
 */
export function reloadPlugin(pluginId: string): void {
  // Check if the resource is already being reloaded
  if (reloadingResources.has(pluginId)) {
    const lastReload = reloadingResources.get(pluginId) || 0;
    const now = Date.now();

    // Prevent reloading the same resource too frequently (debounce)
    if (now - lastReload < 1000) {
      alt.log(
        `~ly~[CORE]~w~ Plugin ${pluginId} is already being reloaded, skipping`
      );
      return;
    }
  }

  // Mark the resource as being reloaded
  reloadingResources.set(pluginId, Date.now());

  // Emit reload start event
  alt.emit(RELOAD_START_EVENT, pluginId);
  alt.log(`~lb~[CORE]~w~ Reloading plugin: ${pluginId}`);

  try {
    // Since all plugins are now part of the core resource,
    // we don't need to check if the resource exists or is running
    // Instead, we'll just trigger the plugin reload within the core resource

    // If it's the core itself that needs to be reloaded, restart the core resource
    if (pluginId === 'core') {
      alt.log(`~lb~[CORE]~w~ Reloading core resource`);

      // Restart the core resource
      alt.restartResource('core');

      // Create hot reload event
      const reloadEvent: HotReloadEvent = {
        pluginId,
        type: 'both', // Assuming both client and server are reloaded
        timestamp: Date.now(),
      };

      // Emit reload complete event
      alt.emit(RELOAD_COMPLETE_EVENT, reloadEvent);

      return;
    }

    // For plugins, we'll just trigger the plugin reload event
    // The plugin manager will handle reloading the plugin

    // Create hot reload event
    const reloadEvent: HotReloadEvent = {
      pluginId,
      type: 'both', // Assuming both client and server are reloaded
      timestamp: Date.now(),
    };

    // Emit reload complete event
    alt.emit(RELOAD_COMPLETE_EVENT, reloadEvent);
    alt.log(`~lg~[CORE]~w~ Resource ${pluginId} reloaded successfully`);
  } catch (error) {
    alt.logError(`[CORE] Failed to reload resource ${pluginId}: ${error}`);
    alt.emit(RELOAD_FAILED_EVENT, pluginId, error);
  } finally {
    // Remove the resource from the reloading map
    reloadingResources.delete(pluginId);
  }
}

/**
 * Reload all plugins
 */
export function reloadAllPlugins(): void {
  alt.log('~lb~[CORE]~w~ Reloading all plugins');

  // Since all plugins are now part of the core resource,
  // we need to get the list of plugins from the plugin manager
  // For now, we'll just reload the core resource

  alt.log('~lb~[CORE]~w~ Reloading core resource');
  reloadPlugin('core');
}
