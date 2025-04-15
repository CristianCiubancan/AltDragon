/**
 * Core resource client entry point
 * This is the main entry point for the core resource on the client side
 */

import * as alt from 'alt-client';
import * as native from 'natives';
import { initPluginLoader } from './plugin-loader.js';

// Core resource metadata
const CORE_VERSION = '1.0.0';

// Event bus for client-side inter-plugin communication
const eventHandlers = new Map<string, Array<(...args: any[]) => void>>();

// Store original WebView constructor
const OriginalWebView = alt.WebView;

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

  // Override the WebView class
  overrideWebView();

  // Create the client-side core API
  createClientAPI();

  // Initialize the plugin loader
  initPluginLoader();

  // Show controls help notification
  showControlsHelp();

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

// Track active webviews for management
const activeWebviews = new Map<string, alt.WebView>();

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

    // Standardize URL for WebViews
    standardizeUrl: standardizeUrl,

    // Create a WebView with a standardized URL
    createWebView: (url: string, isOverlay = false, pluginId?: string) => {
      try {
        const standardizedUrl = standardizeUrl(url, pluginId);
        coreAPI.log(
          `Creating WebView for: ${url} (standardized to: ${standardizedUrl})`
        );
        return new globalThis.WebViewProxy(standardizedUrl, isOverlay);
      } catch (error) {
        coreAPI.log(`Error creating WebView: ${error}`, 'error');
        return null;
      }
    },

    // Create and manage a UI webview (with standard UI controls like cursor handling)
    createUIWebView: (
      pluginId: string,
      htmlPath: string,
      options: UIWebViewOptions = {}
    ) => {
      try {
        // Default options
        const {
          handleCursor = true,
          disableControls = true,
          overlay = false,
          eventHandlers = {},
        } = options;

        // Close any existing UI for this plugin ID
        coreAPI.closeUIWebView(pluginId);

        // Create the WebView
        const webviewId = `${pluginId}:${htmlPath}`;
        coreAPI.log(`Creating UI WebView for plugin ${pluginId}: ${htmlPath}`);

        const webview = coreAPI.createWebView(htmlPath, overlay, pluginId);

        if (!webview) {
          coreAPI.log(`Failed to create WebView for ${pluginId}`, 'error');
          return null;
        }

        // Register event handlers
        Object.entries(eventHandlers).forEach(([event, handler]) => {
          webview.on(event, handler);
        });

        // Register standard close events
        const closeEvents = ['ui:close', 'closeUI', 'close'];
        closeEvents.forEach((event) => {
          webview.on(event, () => {
            coreAPI.log(`Received ${event} event from WebView ${webviewId}`);
            coreAPI.closeUIWebView(pluginId);
          });
        });

        // Handle cursor if requested
        if (handleCursor) {
          alt.showCursor(true);
        }

        // Disable game controls if requested
        if (disableControls) {
          alt.toggleGameControls(false);
        }

        // Focus the webview to allow interaction/clicking
        try {
          alt.log(
            `~lb~[CORE:CLIENT]~w~ Focusing WebView for plugin ${pluginId}`
          );
          webview.focus();

          // In alt:V, we need to ensure the WebView is properly focused
          if (handleCursor) {
            // Show the cursor again after focusing to ensure it's visible
            alt.setTimeout(() => {
              alt.showCursor(true);
            }, 50);
          }
        } catch (focusError) {
          coreAPI.log(`Error focusing WebView: ${focusError}`, 'error');
        }

        // Store the webview
        activeWebviews.set(pluginId, webview);

        return webview;
      } catch (error) {
        coreAPI.log(`Error creating UI WebView: ${error}`, 'error');
        return null;
      }
    },

    // Close a UI webview
    closeUIWebView: (pluginId: string) => {
      try {
        const webview = activeWebviews.get(pluginId);

        if (webview) {
          coreAPI.log(`Closing UI WebView for plugin ${pluginId}`);

          // Unfocus the webview before destroying it
          try {
            webview.unfocus();
          } catch (unfocusError) {
            // Ignore unfocus errors, just log them
            coreAPI.log(`Error unfocusing WebView: ${unfocusError}`, 'warn');
          }

          // Destroy the webview
          webview.destroy();

          // Remove from active webviews
          activeWebviews.delete(pluginId);

          // Restore cursor and game controls if no other webviews are active
          if (activeWebviews.size === 0) {
            alt.showCursor(false);
            alt.toggleGameControls(true);
          }

          return true;
        }

        return false;
      } catch (error) {
        coreAPI.log(`Error closing UI WebView: ${error}`, 'error');
        return false;
      }
    },

    // Check if a plugin has an active webview
    hasActiveWebView: (pluginId: string) => {
      return activeWebviews.has(pluginId);
    },

    // Get all active webviews
    getActiveWebViews: () => {
      return Array.from(activeWebviews.keys());
    },

    // Close all webviews
    closeAllWebViews: () => {
      try {
        const webviews = Array.from(activeWebviews.entries());

        // First unfocus all webviews
        webviews.forEach(([pluginId, webview]) => {
          try {
            webview.unfocus();
          } catch (unfocusError) {
            // Ignore unfocus errors, just log them
            coreAPI.log(
              `Error unfocusing WebView for ${pluginId}: ${unfocusError}`,
              'warn'
            );
          }
        });

        // Then destroy all webviews
        webviews.forEach(([pluginId, webview]) => {
          try {
            webview.destroy();
            activeWebviews.delete(pluginId);
          } catch (destroyError) {
            coreAPI.log(
              `Error destroying WebView for ${pluginId}: ${destroyError}`,
              'error'
            );
          }
        });

        // Clear the active webviews map
        activeWebviews.clear();

        // Ensure cursor and game controls are reset
        alt.showCursor(false);
        alt.toggleGameControls(true);

        return true;
      } catch (error) {
        coreAPI.log(`Error closing all WebViews: ${error}`, 'error');
        return false;
      }
    },
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

/**
 * Show help notification about available controls
 */
function showControlsHelp(): void {
  // Wait a bit to make sure the player has spawned
  alt.setTimeout(() => {
    showNotification('Press ~y~F1~w~ to toggle HTML UI');

    alt.setTimeout(() => {
      showNotification('Press ~y~F2~w~ to toggle TS UI');
    }, 3000);

    alt.setTimeout(() => {
      showNotification('Press ~y~F3~w~ to heal player, ~y~F4~w~ for debug UI');
    }, 6000);
  }, 2000);
}

/**
 * Show a notification to the player
 */
function showNotification(message: string): void {
  try {
    native.beginTextCommandThefeedPost('STRING');
    native.addTextComponentSubstringPlayerName(message);
    native.endTextCommandThefeedPostTicker(false, true);
  } catch (error) {
    alt.logError(`[CORE:CLIENT] Error showing notification: ${error}`);
  }
}

/**
 * Standardize a URL for WebView
 * @param url The URL to standardize
 * @param pluginId Optional plugin ID for plugin-specific resources
 * @returns The standardized URL
 */
function standardizeUrl(url: string, pluginId?: string): string {
  // Log the incoming URL for debugging
  alt.log(
    `[CORE:CLIENT] Standardizing URL: ${url}, pluginId: ${pluginId || 'none'}`
  );

  // If it's already a resource URL, use it
  if (
    url.startsWith('http://resource/') ||
    url.startsWith('https://resource/')
  ) {
    alt.log(`[CORE:CLIENT] URL is already in resource format: ${url}`);
    return url;
  }

  // If it's a plugin-relative path with a plugin ID (like 'html/ui.html' or 'client/html/ui.html')
  if (pluginId && !url.startsWith('http://') && !url.startsWith('https://')) {
    // For the new standalone resource structure, the correct format is:
    // http://resource/<pluginId>/client/html/<filename>

    // Handle different path formats
    let resourceUrl;

    if (url.startsWith('client/html/')) {
      // Format: client/html/ui.html
      resourceUrl = `http://resource/${pluginId}/${url}`;
    } else if (url.startsWith('html/')) {
      // Format: html/ui.html
      resourceUrl = `http://resource/${pluginId}/client/${url}`;
    } else if (url.indexOf('/') === -1) {
      // Format: ui.html (just filename)
      resourceUrl = `http://resource/${pluginId}/client/html/${url}`;
    } else {
      // Any other format, assume it's a full path within the plugin resource
      resourceUrl = `http://resource/${pluginId}/${url}`;
    }

    alt.log(`[CORE:CLIENT] Converted plugin path to resource: ${resourceUrl}`);
    return resourceUrl;
  }

  // For any other relative path
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    const resourceUrl = `http://resource/${url}`;
    alt.log(
      `[CORE:CLIENT] Converted relative path to resource: ${resourceUrl}`
    );
    return resourceUrl;
  }

  // For external URLs, keep them as-is
  alt.log(`[CORE:CLIENT] Keeping URL as-is: ${url}`);
  return url;
}

/**
 * Override the WebView class to standardize URLs
 */
function overrideWebView(): void {
  // Create a proxy for WebView creation
  globalThis.WebViewProxy = function (url: string, isOverlay = false) {
    try {
      // Debug log
      alt.log(
        `~lb~[CORE:CLIENT]~w~ Creating WebView with URL: ${url}, overlay: ${isOverlay}`
      );

      // Create the WebView with proper error handling
      const webview = new OriginalWebView(url, isOverlay);

      // Check if WebView was created successfully
      if (!webview) {
        alt.logError(
          `[CORE:CLIENT] WebView creation returned null for URL: ${url}`
        );
        throw new Error('WebView creation failed, returned null');
      }

      alt.log(`~lg~[CORE:CLIENT]~w~ WebView created successfully: ${url}`);
      return webview;
    } catch (error) {
      alt.logError(`[CORE:CLIENT] Error creating WebView: ${error}`);
      throw error; // Rethrow to allow caller to handle
    }
  };

  // Copy prototype methods from the original class to maintain the same API
  globalThis.WebViewProxy.prototype = OriginalWebView.prototype;

  // Monkey patch methods that create WebViews to use our proxy instead
  alt.log(
    '~lg~[CORE:CLIENT]~w~ WebView proxy has been created to standardize URLs'
  );
}

// Initialize the client-side core resource
initCore();
