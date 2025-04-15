/**
 * Plugin loader for the core resource
 * This file is responsible for loading all plugins
 */

import * as alt from 'alt-server';
import * as fs from 'fs';
import * as path from 'path';

// Plugin metadata cache
const pluginMetadata = new Map<string, any>();

/**
 * Initialize the plugin loader
 * This is called when the core resource starts
 */
export function initPluginLoader(): void {
  alt.log('~lb~[CORE]~w~ Initializing plugin loader');

  // Scan for plugins but don't try to execute them
  scanPlugins();

  alt.log('~lg~[CORE]~w~ Plugin loader initialized');
}

/**
 * Scan for plugins in the plugins directory
 */
function scanPlugins(): void {
  alt.log('~lb~[CORE]~w~ Scanning for plugins');

  try {
    // Get the plugins directory path
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

    // Scan each plugin
    for (const pluginName of pluginDirs) {
      scanPlugin(pluginName);
    }

    alt.log(`~lg~[CORE]~w~ Scanned ${pluginDirs.length} plugins successfully`);
  } catch (error) {
    alt.logError(`[CORE] Error scanning plugins: ${error}`);
  }
}

/**
 * Scan a specific plugin
 * @param pluginName The name of the plugin to scan
 */
function scanPlugin(pluginName: string): void {
  alt.log(`~lb~[CORE]~w~ Scanning plugin: ${pluginName}`);

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

    // Load the plugin's metadata
    let metadata = {
      id: pluginName,
      name: pluginName,
      version: '1.0.0',
      author: 'Unknown',
      description: '',
      dependencies: ['core'],
      supportsHotReload: true,
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

    // Store the metadata
    pluginMetadata.set(pluginName, metadata);

    alt.log(`~lg~[CORE]~w~ Plugin ${pluginName} scanned successfully`);
  } catch (error) {
    alt.logError(`[CORE] Error scanning plugin ${pluginName}: ${error}`);
  }
}

/**
 * Get all plugin IDs
 * @returns Array of plugin IDs
 */
export function getPluginIds(): string[] {
  return Array.from(pluginMetadata.keys());
}

/**
 * Get plugin metadata
 * @param pluginId The plugin ID
 * @returns The plugin metadata or null if not found
 */
export function getPluginMetadata(pluginId: string): any | null {
  return pluginMetadata.get(pluginId) || null;
}
