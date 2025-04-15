/**
 * Plugin manager for the core resource
 * Handles plugin registration, dependencies, and lifecycle
 */

import * as alt from 'alt-server';
import * as fs from 'fs';
import * as path from 'path';
import {
  PluginMetadata,
  PluginLifecycle,
  CoreAPI,
} from '../shared/interfaces.js';

// Map of registered plugins
const plugins = new Map<
  string,
  {
    metadata: PluginMetadata;
    lifecycle: PluginLifecycle;
    api: any; // Plugin-specific API
  }
>();

// Event bus for inter-plugin communication
const eventHandlers = new Map<string, Array<(...args: any[]) => void>>();

/**
 * Initialize the plugin manager
 * This is called when the core resource starts
 */
export function initPluginManager(): void {
  alt.log('~lb~[CORE]~w~ Initializing plugin manager');

  // Create the core API that will be exposed to plugins
  const coreAPI: CoreAPI = {
    registerPlugin,
    getPlugin,
    isPluginLoaded,
    log: (message: string, level: 'info' | 'warn' | 'error' = 'info') => {
      switch (level) {
        case 'info':
          alt.log(`~lg~[PLUGIN]~w~ ${message}`);
          break;
        case 'warn':
          alt.log(`~ly~[PLUGIN]~w~ ${message}`);
          break;
        case 'error':
          alt.logError(`[PLUGIN] ${message}`);
          break;
      }
    },
    on: (eventName: string, handler: (...args: any[]) => void) => {
      if (!eventHandlers.has(eventName)) {
        eventHandlers.set(eventName, []);
      }
      eventHandlers.get(eventName)?.push(handler);
    },
    emit: (eventName: string, ...args: any[]) => {
      const handlers = eventHandlers.get(eventName) || [];
      for (const handler of handlers) {
        try {
          handler(...args);
        } catch (error) {
          alt.logError(
            `[CORE] Error in event handler for ${eventName}: ${error}`
          );
        }
      }
    },
  };

  // Expose the core API globally so plugins can access it
  (global as any).core = coreAPI;

  // Plugins are now loaded directly via imports in plugin-loader.ts
  // No need to dynamically load them here

  alt.log('~lg~[CORE]~w~ Plugin manager initialized');
}

// These functions (loadAllPlugins and loadPlugin) are unused in the current implementation
// since plugins are now loaded via the plugin-loader.ts
// Removing to eliminate redundant code

/**
 * Register a plugin with the core resource
 * @param metadata Plugin metadata
 * @param lifecycle Plugin lifecycle hooks
 * @returns The plugin API object
 */
function registerPlugin(
  metadata: PluginMetadata,
  lifecycle: PluginLifecycle
): void {
  alt.log(
    `~lb~[CORE]~w~ Registering plugin: ${metadata.name} (${metadata.id})`
  );

  // Check if the plugin is already registered
  if (plugins.has(metadata.id)) {
    alt.log(
      `~ly~[CORE]~w~ Plugin ${metadata.id} is already registered, updating`
    );

    // Call the onUnload hook if it exists
    const existingPlugin = plugins.get(metadata.id);
    if (existingPlugin?.lifecycle.onUnload) {
      try {
        existingPlugin.lifecycle.onUnload();
      } catch (error) {
        alt.logError(
          `[CORE] Error in onUnload hook for ${metadata.id}: ${error}`
        );
      }
    }
  }

  // Check dependencies
  for (const dependency of metadata.dependencies) {
    if (!plugins.has(dependency)) {
      alt.logError(
        `[CORE] Plugin ${metadata.id} depends on ${dependency}, but it is not loaded`
      );
      return;
    }
  }

  // Create the plugin API object
  const api = {};

  // Register the plugin
  plugins.set(metadata.id, {
    metadata,
    lifecycle,
    api,
  });

  // Call the onLoad hook if it exists
  if (lifecycle.onLoad) {
    try {
      lifecycle.onLoad();
    } catch (error) {
      alt.logError(`[CORE] Error in onLoad hook for ${metadata.id}: ${error}`);
    }
  }

  alt.log(`~lg~[CORE]~w~ Plugin ${metadata.id} registered successfully`);
}

/**
 * Get a plugin by ID
 * @param pluginId The ID of the plugin
 * @returns The plugin API object, or null if the plugin is not loaded
 */
function getPlugin(pluginId: string): any | null {
  const plugin = plugins.get(pluginId);
  if (!plugin) {
    return null;
  }

  return plugin.api;
}

/**
 * Check if a plugin is loaded
 * @param pluginId The ID of the plugin
 * @returns True if the plugin is loaded, false otherwise
 */
function isPluginLoaded(pluginId: string): boolean {
  return plugins.has(pluginId);
}
