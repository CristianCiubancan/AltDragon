/**
 * Core resource shared interfaces
 * These interfaces define the contract between the core resource and plugins
 */

/**
 * Plugin metadata interface
 * Contains information about a plugin that the core resource needs to know
 */
export interface PluginMetadata {
  /** Unique identifier for the plugin */
  id: string;

  /** Human-readable name of the plugin */
  name: string;

  /** Plugin version */
  version: string;

  /** Plugin author */
  author: string;

  /** Plugin description */
  description: string;

  /** Dependencies on other plugins */
  dependencies: string[];

  /** Whether the plugin supports hot reloading */
  supportsHotReload?: boolean;
}

/**
 * Plugin lifecycle hooks
 * These hooks are called at various points in the plugin lifecycle
 */
export interface PluginLifecycle {
  /** Called when the plugin is loaded */
  onLoad?: () => void | Promise<void>;

  /** Called when the plugin is unloaded */
  onUnload?: () => void | Promise<void>;
}

/**
 * Plugin API interface
 * Defines the API that plugins can use to interact with the core resource
 */
export interface CoreAPI {
  /** Register a plugin with the core resource */
  registerPlugin: (
    metadata: PluginMetadata,
    lifecycle: PluginLifecycle
  ) => void;

  /** Get a plugin by ID */
  getPlugin: (pluginId: string) => any | null;

  /** Check if a plugin is loaded */
  isPluginLoaded: (pluginId: string) => boolean;

  /** Log a message to the console with the plugin's name */
  log: (message: string, level?: 'info' | 'warn' | 'error') => void;

  /** Register an event handler */
  on: (eventName: string, handler: (...args: any[]) => void) => void;

  /** Emit an event */
  emit: (eventName: string, ...args: any[]) => void;
}
