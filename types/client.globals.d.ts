/**
 * Global type declarations for alt-client
 */

import * as altClient from 'alt-client';

declare global {
  // Global WebViewProxy constructor
  let WebViewProxy: typeof altClient.WebView;

  // Declare alt as a global variable with alt-client types
  namespace alt {
    const WebView: typeof altClient.WebView;
  }
  const alt: typeof altClient;
}

export {};
