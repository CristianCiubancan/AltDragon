/**
 * Global type declarations for server-side
 */

import * as altServer from 'alt-server';

declare global {
  // Declare alt as a global variable with alt-server types
  const alt: typeof altServer;

  // Ensure the ServerPlugin interface is available globally
  export interface ServerPlugin {
    [key: string]: unknown;
  }

  // NodeJS types
  namespace NodeJS {
    interface ProcessEnv {
      [key: string]: string | undefined;
    }
  }
}

export {};
