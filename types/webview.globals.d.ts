/**
 * Global type declarations for WebView and browser-specific interfaces
 */

declare global {
  interface Window {
    alt?: {
      emit: (eventName: string, ...args: unknown[]) => void;
      on: (eventName: string, callback: (...args: unknown[]) => void) => void;
      off: (eventName: string, callback: (...args: unknown[]) => void) => void;
      Voice?: {
        activationKey: number;
      };
    };
    core?: CoreAPI;
  }

  // Define WebView options interface used with createUIWebView
  interface UIWebViewOptions {
    handleCursor?: boolean;
    disableControls?: boolean;
    overlay?: boolean;
    eventHandlers?: {[event: string]: (...args: any[]) => void};
  }

  // Define the core API interface
  interface CoreAPI {
    on: (eventName: string, handler: (...args: any[]) => void) => void;
    emit: (eventName: string, ...args: any[]) => void;
    log: (message: string, level?: 'info' | 'warn' | 'error') => void;
    getVersion: () => string;
    standardizeUrl: (url: string, pluginId?: string) => string;
    createWebView: (url: string, isOverlay?: boolean, pluginId?: string) => any;
    
    // UI WebView management
    createUIWebView: (
      pluginId: string, 
      htmlPath: string, 
      options?: UIWebViewOptions
    ) => any;
    
    closeUIWebView: (pluginId: string) => boolean;
    hasActiveWebView: (pluginId: string) => boolean;
    getActiveWebViews: () => string[];
    closeAllWebViews: () => boolean;
  }

  // Explicitly declare alt and core as global variables
  const alt: Window['alt'];
  const core: CoreAPI;
}

export {};
