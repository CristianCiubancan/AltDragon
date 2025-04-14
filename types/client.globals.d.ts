/**
 * Global type declarations for ClientPlugin and ServerPlugin interfaces
 * used throughout the codebase
 */

import * as altClient from 'alt-client';

declare global {
    export interface ClientPlugin {
        [key: string]: unknown;
    }

    export interface ServerPlugin {
        [key: string]: unknown;
    }

    // Declare alt as a global variable with alt-client types
    const alt: typeof altClient;
    
    // Define KeyBindRestrictions for client-side keybinds
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
    
    // Define KeyInfo interface for client-side keybinds
    interface KeyInfo {
        key: number;
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
        restrictions?: KeyBindRestrictions;
        doNotAllowRebind?: boolean;
    }
}

export {};