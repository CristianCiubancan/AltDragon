/**
 * Development script for the AltV project
 * Builds and starts the AltV server
 */

const { spawn } = require('child_process');
const { build } = require('./build');

/**
 * Start the development environment
 */
function startDev() {
  console.log('Starting development environment...');

  // Build the project
  build(false);

  // Start the AltV server
  const serverProcess = spawn(
    process.platform === 'win32' ? 'altv-server.exe' : './altv-server',
    [],
    { stdio: 'inherit', cwd: process.cwd() }
  );

  // Handle server exit
  serverProcess.on('exit', (code) => {
    console.log(`Server exited with code ${code}`);
    process.exit(code);
  });

  // Handle process exit
  process.on('exit', () => {
    serverProcess.kill();
  });

  console.log('Development environment started successfully!');
}

// Start the development environment
startDev();
