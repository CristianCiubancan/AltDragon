/**
 * Core resource client entry point
 * This is the main entry point for the core resource on the client side
 */

import * as alt from 'alt-client';
import { initPluginLoader } from './plugin-loader.js';

// Core resource metadata
const CORE_VERSION = '1.0.0';

// Event bus for client-side inter-plugin communication
const eventHandlers = new Map<string, Array<(...args: any[]) => void>>();

/**
 * Initialize the core resource on the client side
 * This is called when the resource starts
 */
function initCore(): void {
  alt.log('~lb~=================================~w~');
  alt.log(
    '~lb~[CORE:CLIENT]~w~ Initializing client-side core resource v' +
      CORE_VERSION
  );

  // Register event handlers
  registerEventHandlers();

  // Create the client-side core API
  createClientAPI();

  // Initialize the plugin loader
  initPluginLoader();

  alt.log(
    '~lg~[CORE:CLIENT]~w~ Client-side core resource initialized successfully'
  );
  alt.log('~lb~=================================~w~');
}

/**
 * Register event handlers for the client-side core resource
 */
function registerEventHandlers(): void {
  // Listen for core initialization event from the server
  alt.onServer('core:init', handleCoreInit);
}

/**
 * Handle core initialization event from the server
 */
function handleCoreInit(): void {
  alt.log('~lb~[CORE:CLIENT]~w~ Core initialized by server');

  // Notify the server that the client is ready
  alt.emitServer('core:clientReady');
}

/**
 * Create the client-side core API
 * This API is exposed to client-side plugin code
 */
function createClientAPI(): void {
  // Create the core API object
  const coreAPI = {
    // Register an event handler
    on: (eventName: string, handler: (...args: any[]) => void) => {
      if (!eventHandlers.has(eventName)) {
        eventHandlers.set(eventName, []);
      }
      eventHandlers.get(eventName)?.push(handler);
    },

    // Emit an event
    emit: emitEvent,

    // Log a message to the console
    log: (message: string, level: 'info' | 'warn' | 'error' = 'info') => {
      switch (level) {
        case 'info':
          alt.log(`~lg~[PLUGIN:CLIENT]~w~ ${message}`);
          break;
        case 'warn':
          alt.log(`~ly~[PLUGIN:CLIENT]~w~ ${message}`);
          break;
        case 'error':
          alt.logError(`[PLUGIN:CLIENT] ${message}`);
          break;
      }
    },

    // Get the core version
    getVersion: () => CORE_VERSION,
  };

  // Expose the core API globally
  // Use global scope instead of window (which doesn't exist in alt:V client context)
  (globalThis as any).core = coreAPI;
}

/**
 * Emit an event to all registered handlers
 * @param eventName The name of the event
 * @param args The arguments for the event
 */
function emitEvent(eventName: string, ...args: any[]): void {
  const handlers = eventHandlers.get(eventName) || [];
  for (const handler of handlers) {
    try {
      handler(...args);
    } catch (error) {
      alt.logError(
        `[CORE:CLIENT] Error in event handler for ${eventName}: ${error}`
      );
    }
  }
}

// Initialize the client-side core resource
initCore();
