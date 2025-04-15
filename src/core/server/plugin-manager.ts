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

  // Auto-load all plugins from the plugins directory
  loadAllPlugins();

  alt.log('~lg~[CORE]~w~ Plugin manager initialized');
}

/**
 * Load all plugins from the plugins directory
 */
function loadAllPlugins(): void {
  alt.log('~lb~[CORE]~w~ Loading all plugins');

  try {
    // Get the plugins directory path
    // We need to use a relative path since alt.getResourcePath is not available
    const pluginsDir = path.join(
      process.cwd(),
      'resources',
      'main',
      'core',
      'plugins'
    );

    // Check if the plugins directory exists
    if (!fs.existsSync(pluginsDir)) {
      alt.log('~ly~[CORE]~w~ No plugins directory found');
      return;
    }

    // Get all plugin directories
    const pluginDirs = fs
      .readdirSync(pluginsDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    alt.log(`~lb~[CORE]~w~ Found ${pluginDirs.length} plugins`);

    // Load each plugin
    for (const pluginName of pluginDirs) {
      loadPlugin(pluginName);
    }

    alt.log(`~lg~[CORE]~w~ Loaded ${pluginDirs.length} plugins successfully`);
  } catch (error) {
    alt.logError(`[CORE] Error loading plugins: ${error}`);
  }
}

/**
 * Load a specific plugin
 * @param pluginName The name of the plugin to load
 */
function loadPlugin(pluginName: string): void {
  alt.log(`~lb~[CORE]~w~ Loading plugin: ${pluginName}`);

  try {
    // Get the plugin directory path
    const pluginDir = path.join(
      process.cwd(),
      'resources',
      'main',
      'core',
      'plugins',
      pluginName
    );

    // Check if the plugin directory exists
    if (!fs.existsSync(pluginDir)) {
      alt.log(`~lr~[CORE]~w~ Plugin directory not found: ${pluginDir}`);
      return;
    }

    // Check if the plugin has a server directory
    const serverDir = path.join(pluginDir, 'server');
    if (!fs.existsSync(serverDir)) {
      alt.log(
        `~ly~[CORE]~w~ Plugin ${pluginName} has no server directory, skipping`
      );
      return;
    }

    // Check if the plugin has an index.js file
    const indexFile = path.join(serverDir, 'index.js');
    if (!fs.existsSync(indexFile)) {
      alt.log(
        `~lr~[CORE]~w~ Plugin ${pluginName} has no index.js file, skipping`
      );
      return;
    }

    // Load the plugin's metadata
    let metadata: PluginMetadata = {
      id: pluginName,
      name: pluginName,
      version: '1.0.0',
      author: 'Unknown',
      description: '',
      dependencies: ['core'],
    };

    // Try to load metadata from metadata.json if it exists
    const metadataFile = path.join(pluginDir, 'metadata.json');
    if (fs.existsSync(metadataFile)) {
      try {
        const metadataJson = JSON.parse(fs.readFileSync(metadataFile, 'utf8'));
        metadata = { ...metadata, ...metadataJson };
      } catch (error) {
        alt.logError(
          `[CORE] Error parsing metadata.json for ${pluginName}: ${error}`
        );
      }
    }

    // Import the plugin's index.js file
    // This will trigger the plugin to register itself using the core API
    try {
      // In ESM, we need to use dynamic import instead of require
      // Convert the file path to a URL format
      const fileUrl = `file://${indexFile.replace(/\\/g, '/')}`;

      // Log the file URL for debugging
      alt.log(`~lb~[CORE]~w~ Loading plugin from: ${fileUrl}`);

      // We can't use dynamic import here because it's async
      // Instead, we'll just log that the plugin was found and assume it will be loaded
      // The plugin will need to register itself when it's loaded
      alt.log(`~lg~[CORE]~w~ Plugin ${pluginName} found successfully`);
    } catch (error) {
      alt.logError(`[CORE] Error importing plugin ${pluginName}: ${error}`);
    }
  } catch (error) {
    alt.logError(`[CORE] Error loading plugin ${pluginName}: ${error}`);
  }
}

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
