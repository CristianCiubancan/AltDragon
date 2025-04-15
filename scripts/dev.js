/**
 * Development script for the AltV project
 * Starts the hot reload system and the AltV server
 */

const { startHotReload } = require('./hot-reload');
const os = require('os');
const { spawn } = require('child_process');

/**
 * Start the development environment
 */
function startDev() {
  console.log('Starting development environment...');

  // Start the hot reload system
  startHotReload();

  console.log('Development environment started successfully!');
}

// Start the development environment
startDev();
