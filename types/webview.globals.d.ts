/**
 * Global type declarations for alt client and other browser-specific interfaces
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

  // Define the core API interface
  interface CoreAPI {
    on: (eventName: string, handler: (...args: any[]) => void) => void;
    emit: (eventName: string, ...args: any[]) => void;
    log: (message: string, level?: 'info' | 'warn' | 'error') => void;
    getVersion: () => string;
  }

  // Explicitly declare alt as a global variable
  const alt: {
    emit: (eventName: string, ...args: unknown[]) => void;
    on: (eventName: string, callback: (...args: unknown[]) => void) => void;
    off: (eventName: string, callback: (...args: unknown[]) => void) => void;
    Voice?: {
      activationKey: number;
    };
  };

  // Explicitly declare core as a global variable
  const core: CoreAPI;

  interface KeyInfo {
    key: number;
    keyCode: number;
    identifier: string;
    disabled?: boolean;
    spamPreventionInMs?: number;
    allowInAnyMenu?: boolean;
    allowInSpecificPage?: string;
    allowIfDead?: boolean;
    modifier?: string;
    delayedKeyDown?: {
      msToTrigger: number;
      callback: () => void;
    };
    keyDown?: () => void;
    keyUp?: () => void;
    whilePressed?: () => void;
    restrictions?: unknown;
    doNotAllowRebind?: boolean;
  }

  interface KeyBindRestrictions {
    isAiming?: boolean;
    isOnFoot?: boolean;
    isVehicle?: boolean;
    isVehicleDriver?: boolean;
    isVehiclePassenger?: boolean;
    vehicleModels?: number[];
    isSwimming?: boolean;
    weaponModels?: number[];
  }
}

export {};
