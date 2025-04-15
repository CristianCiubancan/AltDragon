/**
 * Improved development script for the AltV project
 * Provides a better development experience with hot reloading
 * Cross-platform compatible for both Windows and Linux
 */

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');

// Configuration
const isWindows = process.platform === 'win32';
const killCommand = isWindows
  ? 'taskkill /F /IM altv-server.exe'
  : 'pkill -f altv-server || true';

/**
 * Kill any existing AltV processes
 */
function killExistingProcesses() {
  try {
    console.log('Killing any existing AltV processes...');
    execSync(killCommand, { stdio: 'ignore' });
    console.log('Existing processes killed successfully.');
  } catch (error) {
    // It's okay if there are no processes to kill
    console.log('No existing AltV processes found.');
  }
}

/**
 * Start the development environment
 * @param {boolean} hotReload Whether to use hot reloading
 */
function startDev(hotReload = true) {
  console.log('Starting development environment...');
  console.log(`Platform: ${process.platform} (${os.type()} ${os.release()})`);
  console.log(`Hot reload: ${hotReload ? 'enabled' : 'disabled'}`);

  // Kill any existing AltV processes
  killExistingProcesses();

  // Start the appropriate development process
  if (hotReload) {
    startHotReloadDev();
  } else {
    startRegularDev();
  }
}

/**
 * Start development with hot reloading
 */
function startHotReloadDev() {
  console.log('Starting development with hot reloading...');

  // Start the hot reload process
  const hotReloadProcess = spawn('node', ['scripts/hot-reload-improved.js'], {
    stdio: 'inherit',
    shell: true,
  });

  // Handle process exit
  hotReloadProcess.on('exit', (code) => {
    console.log(`Hot reload process exited with code ${code}`);
    process.exit(code);
  });

  // Handle process errors
  hotReloadProcess.on('error', (error) => {
    console.error(`Hot reload process error: ${error.message}`);
    process.exit(1);
  });

  // Handle SIGINT (Ctrl+C)
  process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down...');
    hotReloadProcess.kill();
    process.exit(0);
  });
}

/**
 * Start development without hot reloading
 */
function startRegularDev() {
  console.log('Starting development without hot reloading...');

  // Build the project
  const buildProcess = spawn('node', ['scripts/build-improved.js'], {
    stdio: 'inherit',
    shell: true,
  });

  // Wait for build to complete
  buildProcess.on('exit', (code) => {
    if (code !== 0) {
      console.error(`Build failed with code ${code}`);
      process.exit(code);
    }

    console.log('Build completed successfully, starting server...');

    // Start the AltV server
    const serverExe = isWindows ? 'altv-server.exe' : './altv-server';
    const serverProcess = spawn(serverExe, [], {
      stdio: 'inherit',
      cwd: process.cwd(),
    });

    // Handle server exit
    serverProcess.on('exit', (code) => {
      console.log(`Server exited with code ${code}`);
      process.exit(code);
    });

    // Handle server errors
    serverProcess.on('error', (err) => {
      console.error(`Server error: ${err.message}`);
      process.exit(1);
    });

    // Handle process exit
    process.on('exit', () => {
      if (!serverProcess.killed) {
        console.log('Shutting down server...');
        serverProcess.kill();
      }
    });

    // Handle SIGINT (Ctrl+C)
    process.on('SIGINT', () => {
      console.log('Received SIGINT, shutting down...');
      if (!serverProcess.killed) {
        serverProcess.kill();
      }
      process.exit(0);
    });
  });

  // Handle build errors
  buildProcess.on('error', (error) => {
    console.error(`Build process error: ${error.message}`);
    process.exit(1);
  });
}

/**
 * Deploy plugins to the resources directory
 * This is useful for testing plugins without hot reloading
 */
function deployPlugins() {
  console.log('Deploying plugins...');

  // Build the project
  const buildProcess = spawn('node', ['scripts/build-improved.js'], {
    stdio: 'inherit',
    shell: true,
  });

  // Wait for build to complete
  buildProcess.on('exit', (code) => {
    if (code !== 0) {
      console.error(`Build failed with code ${code}`);
      process.exit(code);
    }

    console.log('Build completed successfully, plugins deployed!');
  });

  // Handle build errors
  buildProcess.on('error', (error) => {
    console.error(`Build process error: ${error.message}`);
    process.exit(1);
  });
}

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0] || 'dev';

// Execute the appropriate command
switch (command) {
  case 'dev':
    startDev(true);
    break;
  case 'dev:no-hot':
    startDev(false);
    break;
  case 'deploy-plugins':
    deployPlugins();
    break;
  default:
    console.error(`Unknown command: ${command}`);
    console.log('Available commands:');
    console.log('  dev - Start development with hot reloading');
    console.log('  dev:no-hot - Start development without hot reloading');
    console.log('  deploy-plugins - Deploy plugins to the resources directory');
    process.exit(1);
}
