/**
 * Example plugin with HTML UI - Shared code
 * This file contains code that is shared between the server and client
 */

// Event names
export const Events = {
  NOTIFICATION: 'example:notification',
  TOGGLE_UI: 'example:toggleUI',
  HEAL: 'example:heal',
};

// UI configuration
export const UIConfig = {
  TOGGLE_KEY: 85, // 'U' key
  TOGGLE_MODIFIER: 16, // Shift key
};

// Teleport locations
export const Locations = {
  AIRPORT: { x: -1045.0, y: -2750.0, z: 21.0 },
  CITY_HALL: { x: 233.0, y: -411.0, z: 48.0 },
  BEACH: { x: -1712.0, y: -1082.0, z: 13.0 },
};
