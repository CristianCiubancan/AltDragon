/**
 * Development script for the AltV project
 * Builds and starts the AltV server
 * Handles plugin registration and resource.toml management
 */

const { spawn } = require('child_process');
const { build } = require('./build');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

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
};

/**
 * Start the development environment
 */
function startDev() {
  console.log('Starting development environment...');
  console.log(`Platform: ${process.platform} (${os.type()} ${os.release()})`);

  // Build the project
  const buildResult = build(false);
  if (!buildResult) {
    console.error('Build failed, but continuing with server start...');
  }

  // Print loaded plugins information
  printLoadedPlugins();

  // Start the AltV server
  const serverExe =
    process.platform === 'win32' ? 'altv-server.exe' : './altv-server';
  console.log(`Starting AltV server: ${serverExe}`);

  const serverProcess = spawn(serverExe, [], {
    stdio: 'inherit',
    cwd: process.cwd(),
  });

  // Handle server exit
  serverProcess.on('exit', (code) => {
    console.log(`Server exited with code ${code}`);
    process.exit(code);
  });

  // Handle process errors
  serverProcess.on('error', (err) => {
    console.error(`Failed to start server: ${err.message}`);
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

  console.log('Development environment started successfully!');
}

/**
 * Print information about loaded plugins
 */
function printLoadedPlugins() {
  try {
    const pluginsDir = path.join(config.outputCoreDir, 'plugins');
    if (!fs.existsSync(pluginsDir)) {
      console.log('No plugins directory found');
      return;
    }

    const pluginDirs = fs
      .readdirSync(pluginsDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    if (pluginDirs.length === 0) {
      console.log('No plugins found');
      return;
    }

    console.log('\n=== Loaded Plugins ===');

    let totalClientFiles = 0;
    let totalServerFiles = 0;
    let totalSharedFiles = 0;

    for (const pluginName of pluginDirs) {
      const metadataPath = path.join(pluginsDir, pluginName, 'metadata.json');
      if (fs.existsSync(metadataPath)) {
        try {
          const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
          const clientFiles = metadata.clientFiles?.length || 0;
          totalClientFiles += clientFiles;

          // Count server files
          const serverDir = path.join(pluginsDir, pluginName, 'server');
          const serverFiles = fs.existsSync(serverDir)
            ? countFiles(serverDir)
            : 0;
          totalServerFiles += serverFiles;

          // Count shared files
          const sharedDir = path.join(pluginsDir, pluginName, 'shared');
          const sharedFiles = fs.existsSync(sharedDir)
            ? countFiles(sharedDir)
            : 0;
          totalSharedFiles += sharedFiles;

          console.log(
            `- ${metadata.name} (${metadata.id}) v${metadata.version}`
          );
          console.log(
            `  Client: ${clientFiles} files, Server: ${serverFiles} files, Shared: ${sharedFiles} files`
          );
          if (metadata.description) {
            console.log(`  Description: ${metadata.description}`);
          }
        } catch (error) {
          console.error(
            `Error reading metadata for ${pluginName}: ${error.message}`
          );
        }
      } else {
        console.log(`- ${pluginName} (No metadata found)`);
      }
    }

    console.log('\nTotal:');
    console.log(`- ${pluginDirs.length} plugins`);
    console.log(`- ${totalClientFiles} client file patterns`);
    console.log(`- ${totalServerFiles} server files`);
    console.log(`- ${totalSharedFiles} shared files`);
    console.log('======================\n');
  } catch (error) {
    console.error(`Error printing loaded plugins: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

/**
 * Count files in a directory recursively
 * @param {string} dir Directory to count files in
 * @returns {number} Number of files
 */
function countFiles(dir) {
  let count = 0;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        count += countFiles(fullPath);
      } else {
        count++;
      }
    }
  } catch (error) {
    console.error(`Error counting files in ${dir}: ${error.message}`);
  }
  return count;
}

// Start the development environment
startDev();
