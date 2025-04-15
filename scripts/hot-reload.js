/**
 * Improved hot reload script for the AltV project
 * Uses esbuild to watch for file changes and trigger resource reloads
 * Cross-platform compatible for both Windows and Linux
 */

const fs = require('fs-extra');
const path = require('path');
const { spawn, execSync } = require('child_process');
const net = require('net');
const esbuild = require('esbuild');
const chokidar = require('chokidar');
const { build } = require('./build');

// Configuration
const config = {
  // Source directories
  srcDir: path.join(__dirname, '..', 'src'),
  coreDir: path.join(__dirname, '..', 'src', 'core'),
  pluginsDir: path.join(__dirname, '..', 'src', 'plugins'),

  // Output directories
  resourcesDir: path.join(__dirname, '..', 'resources'),
  mainDir: path.join(__dirname, '..', 'resources', 'main'),
  outputCoreDir: path.join(__dirname, '..', 'resources', 'main', 'core'),
  outputPluginsDir: path.join(__dirname, '..', 'resources', 'main', 'plugins'),

  // Hot reload configuration
  reloadPort: 9790, // Use a different port than the default 9789 to avoid conflicts
  debounceTime: 500, // Debounce time in milliseconds
};

// Map to track which resources need to be reloaded
const pendingReloads = new Set();

// Debounce timer for reloads
let reloadTimer = null;

// Server process
let serverProcess = null;

/**
 * Start the hot reload system
 */
async function startHotReload() {
  console.log('Starting hot reload system...');

  // Perform initial build
  build(false);

  // Start the reload server
  startReloadServer();

  // Start file watcher
  startFileWatcher();

  // Start the AltV server
  startServer();

  console.log('Hot reload system started successfully!');
}

/**
 * Start the reload server
 * This server listens for reload requests from the build process
 */
function startReloadServer() {
  try {
    const server = net.createServer((socket) => {
      console.log('Client connected to reload server');

      socket.on('data', (data) => {
        try {
          const message = JSON.parse(data.toString());
          if (message.type === 'reload') {
            const resources = message.resources || [];
            console.log(
              `Received reload request for resources: ${
                resources.length ? resources.join(', ') : 'all'
              }`
            );

            // Add resources to pending reloads
            if (resources.length > 0) {
              resources.forEach((resource) => pendingReloads.add(resource));
            } else {
              pendingReloads.add('core');
            }

            // Process reloads with debounce
            if (reloadTimer) {
              clearTimeout(reloadTimer);
            }
            reloadTimer = setTimeout(processReloads, config.debounceTime);

            socket.write(
              JSON.stringify({ success: true, message: 'Reload triggered' })
            );
          } else {
            socket.write(
              JSON.stringify({
                success: false,
                message: 'Unknown message type',
              })
            );
          }
        } catch (error) {
          console.error(`Error processing reload message: ${error.message}`);
          socket.write(
            JSON.stringify({ success: false, message: 'Invalid JSON' })
          );
        }
      });

      socket.on('error', (err) => {
        console.error(`Socket error: ${err.message}`);
      });
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(
          `Port ${config.reloadPort} is already in use, trying another port...`
        );
        config.reloadPort++;
        startReloadServer();
      } else {
        console.error(`Reload server error: ${err.message}`);
      }
    });

    server.listen(config.reloadPort, '0.0.0.0', () => {
      console.log(
        `Reload server listening on tcp://0.0.0.0:${config.reloadPort}`
      );

      // Update the reload port in the core resource
      updateReloadPort(config.reloadPort);
    });
  } catch (error) {
    console.error(`Error starting reload server: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

/**
 * Update the reload port in the core resource
 * @param {number} port The port to use
 */
function updateReloadPort(port) {
  try {
    // Update the external-reload.js file in the core resource if it exists
    const externalReloadPath = path.join(
      config.outputCoreDir,
      'server',
      'external-reload.js'
    );

    if (fs.existsSync(externalReloadPath)) {
      let content = fs.readFileSync(externalReloadPath, 'utf8');

      // Replace the port in the file
      content = content.replace(
        /RELOAD_PORT\s*=\s*\d+/,
        `RELOAD_PORT = ${port}`
      );

      // Write the updated content
      fs.writeFileSync(externalReloadPath, content);

      console.log(`Updated reload port in core resource to ${port}`);
    }
  } catch (error) {
    console.error(`Error updating reload port: ${error.message}`);
  }
}

/**
 * Start the file watcher
 * This watches for changes in the source directory and triggers rebuilds
 */
function startFileWatcher() {
  try {
    console.log('Starting file watcher...');

    // Create a watcher for the source directory
    const watcher = chokidar.watch(config.srcDir, {
      ignored: /(^|[\/\\])\../, // Ignore dotfiles
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 300,
        pollInterval: 100,
      },
    });

    // Handle file changes
    watcher.on('all', (event, filePath) => {
      // Normalize path for cross-platform compatibility
      const normalizedPath = filePath.replace(/\\/g, '/');

      console.log(`File ${event}: ${normalizedPath}`);

      // Determine which resource needs to be reloaded
      const resourceName = getResourceForFile(normalizedPath);

      if (resourceName) {
        console.log(`Resource for file: ${resourceName}`);

        // Add to pending reloads
        pendingReloads.add(resourceName);

        // Rebuild the resource
        if (resourceName === 'core') {
          build(false);
        } else {
          // Extract plugin name from resource name
          const pluginName = resourceName;
          const { buildPlugin } = require('./build-improved');
          buildPlugin(pluginName);
        }

        // Process reloads with debounce
        if (reloadTimer) {
          clearTimeout(reloadTimer);
        }
        reloadTimer = setTimeout(processReloads, config.debounceTime);
      } else {
        console.log(`Could not determine resource for file: ${normalizedPath}`);
      }
    });

    console.log('File watcher started successfully!');
  } catch (error) {
    console.error(`Error starting file watcher: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

/**
 * Get the resource name for a file path
 * @param {string} filePath The file path
 * @returns {string|null} The resource name or null if not found
 */
function getResourceForFile(filePath) {
  try {
    // Normalize path for cross-platform compatibility
    const normalizedPath = filePath.replace(/\\/g, '/');

    // Check if it's a core file
    if (normalizedPath.includes('/src/core/')) {
      return 'core';
    }

    // Check if it's a plugin file
    const pluginsMatch = normalizedPath.match(/\/src\/plugins\/([^\/]+)/);
    if (pluginsMatch && pluginsMatch[1]) {
      return pluginsMatch[1];
    }

    return null;
  } catch (error) {
    console.error(`Error determining resource for file: ${error.message}`);
    return null;
  }
}

/**
 * Process pending reloads
 */
function processReloads() {
  try {
    if (pendingReloads.size === 0) {
      console.log('No pending reloads to process');
      return;
    }

    console.log(`Processing ${pendingReloads.size} pending reloads...`);

    // Convert Set to Array
    const resources = Array.from(pendingReloads);

    // Clear pending reloads
    pendingReloads.clear();

    // Send reload request to the server
    sendReloadRequest(resources);

    console.log('Reload request sent to server');
  } catch (error) {
    console.error(`Error processing reloads: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

/**
 * Send a reload request to the server
 * @param {string[]} resources The resources to reload
 * @returns {boolean} Whether the reload was triggered successfully
 */
function sendReloadRequest(resources) {
  try {
    console.log(`Sending reload request for: ${resources.join(', ')}`);

    // Connect to the reload server
    const client = new net.Socket();

    client.connect(config.reloadPort, '0.0.0.0', () => {
      console.log('Connected to reload server');

      // Send the reload request
      const message = {
        type: 'reload',
        resources: resources,
      };

      client.write(JSON.stringify(message));
    });

    client.on('data', (data) => {
      try {
        const response = JSON.parse(data.toString());
        console.log(`Reload response: ${response.message}`);
        client.end();
      } catch (error) {
        console.error(`Error parsing reload response: ${error.message}`);
        client.end();
      }
    });

    client.on('error', (err) => {
      console.error(`Reload client error: ${err.message}`);
      client.end();
      return false;
    });

    return true;
  } catch (error) {
    console.error(`Error sending reload request: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
    return false;
  }
}

/**
 * Start the AltV server
 */
function startServer() {
  try {
    console.log('Starting AltV server...');

    // Determine the server executable based on platform
    const serverExe =
      process.platform === 'win32' ? 'altv-server.exe' : './altv-server';

    // Start the server process
    serverProcess = spawn(serverExe, [], {
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
      if (serverProcess && !serverProcess.killed) {
        console.log('Shutting down server...');
        serverProcess.kill();
      }
    });

    // Handle SIGINT (Ctrl+C)
    process.on('SIGINT', () => {
      console.log('Received SIGINT, shutting down...');
      if (serverProcess && !serverProcess.killed) {
        serverProcess.kill();
      }
      process.exit(0);
    });

    console.log('AltV server started successfully!');
  } catch (error) {
    console.error(`Error starting server: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

// Check if this script is being run directly
if (require.main === module) {
  // Start the hot reload system
  startHotReload();
}

module.exports = { startHotReload };
