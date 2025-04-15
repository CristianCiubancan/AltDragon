/**
 * Hot reload script for the AltV project
 * Uses esbuild to watch for file changes and trigger resource reloads
 */

const fs = require('fs-extra');
const path = require('path');
const { build } = require('./build');
const { spawn } = require('child_process');
const esbuild = require('esbuild');
const chokidar = require('chokidar');
const glob = require('glob');

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

  // Server executable
  serverExe: process.platform === 'win32' ? 'altv-server.exe' : './altv-server',
};

// Map to track which resources need to be reloaded
const pendingReloads = new Set();

// Debounce timer for reloads
let reloadTimer = null;

/**
 * Start the hot reload system
 */
async function startHotReload() {
  console.log('Starting hot reload system...');

  // Perform initial build
  build(false);

  // Start file watcher
  startFileWatcher();

  // Start the AltV server
  startServer();

  console.log('Hot reload system started successfully!');
}

/**
 * Start the file watcher
 */
function startFileWatcher() {
  console.log('Starting file watcher...');

  // Create a watcher for the src directory
  const watcher = chokidar.watch(config.srcDir, {
    ignored: /(^|[\/\\])\../, // Ignore dotfiles
    persistent: true,
  });

  // Handle file changes
  watcher.on('change', handleFileChange);
  watcher.on('add', handleFileAdd);

  console.log('File watcher started successfully!');
}

/**
 * Handle a file change event
 * @param {string} filePath The path of the file that changed
 */
function handleFileChange(filePath) {
  console.log(`File changed: ${filePath}`);

  // Determine which resource needs to be reloaded
  const resourceName = getResourceNameFromPath(filePath);
  if (!resourceName) {
    console.log(`Could not determine resource for file: ${filePath}`);
    return;
  }

  // Add the resource to the pending reloads
  pendingReloads.add(resourceName);

  // Debounce the reload to avoid reloading too frequently
  if (reloadTimer) {
    clearTimeout(reloadTimer);
  }

  reloadTimer = setTimeout(() => {
    // Store the resources that need to be reloaded
    const resourcesToReload = [...pendingReloads];

    // Rebuild the resources
    for (const resource of pendingReloads) {
      if (resource === 'core') {
        buildCore();
      } else {
        buildPlugin(resource);
      }
    }

    // Clear the pending reloads
    pendingReloads.clear();

    // Trigger a reload in the server
    triggerReload(resourcesToReload);
  }, 500);
}

/**
 * Handle a file add event
 * @param {string} filePath The path of the file that was added
 */
function handleFileAdd(filePath) {
  console.log(`File added: ${filePath}`);

  // Handle the same way as a file change
  handleFileChange(filePath);
}

/**
 * Get the resource name from a file path
 * @param {string} filePath The path of the file
 * @returns {string|null} The name of the resource, or null if it couldn't be determined
 */
function getResourceNameFromPath(filePath) {
  // Extract resource name from path
  // This will depend on your project structure
  // For example: src/plugins/example/server/index.ts -> example

  const match = filePath.match(/src\/plugins\/([^\/]+)/);
  if (match && match[1]) {
    return match[1];
  }

  // Check if it's the core resource
  if (filePath.includes('src/core/')) {
    return 'core';
  }

  return null;
}

/**
 * Build the core resource
 */
function buildCore() {
  console.log('Building core resource...');

  // Find all TypeScript files in the server directory
  const serverFiles = glob.sync(
    path.join(config.coreDir, 'server', '**', '*.ts')
  );
  console.log(
    `Found ${serverFiles.length} TypeScript files in ${path.join(
      config.coreDir,
      'server'
    )}`
  );

  // Build server-side files
  esbuild.buildSync({
    entryPoints: serverFiles,
    outdir: path.join(config.outputCoreDir, 'server'),
    platform: 'node',
    target: 'es2020',
    format: 'esm',
    bundle: true,
    sourcemap: true,
    outExtension: { '.js': '.js' },
  });

  // Build client-side files
  const clientFiles = glob.sync(
    path.join(config.coreDir, 'client', '**', '*.ts')
  );
  console.log(
    `Found ${clientFiles.length} TypeScript files in ${path.join(
      config.coreDir,
      'client'
    )}`
  );

  esbuild.buildSync({
    entryPoints: clientFiles,
    outdir: path.join(config.outputCoreDir, 'client'),
    platform: 'browser',
    target: 'es2020',
    format: 'esm',
    bundle: true,
    sourcemap: true,
    outExtension: { '.js': '.js' },
  });

  // Copy shared directory if it exists
  const sharedSrcDir = path.join(config.coreDir, 'shared');
  if (fs.existsSync(sharedSrcDir)) {
    const sharedFiles = glob.sync(path.join(sharedSrcDir, '**', '*.ts'));
    console.log(
      `Found ${sharedFiles.length} TypeScript files in ${sharedSrcDir}`
    );

    // Create shared directory if it doesn't exist
    const sharedDir = path.join(config.outputCoreDir, 'shared');
    if (!fs.existsSync(sharedDir)) {
      fs.mkdirSync(sharedDir, { recursive: true });
    }

    // Build shared files
    esbuild.buildSync({
      entryPoints: sharedFiles,
      outdir: sharedDir,
      platform: 'neutral',
      target: 'es2020',
      format: 'esm',
      bundle: true,
      sourcemap: true,
      outExtension: { '.js': '.js' },
    });
  }

  // Copy resource.toml
  fs.copyFileSync(
    path.join(config.coreDir, 'resource.toml'),
    path.join(config.outputCoreDir, 'resource.toml')
  );

  console.log('Core resource built successfully!');
}

/**
 * Build a specific plugin
 * @param {string} pluginName The name of the plugin to build
 */
function buildPlugin(pluginName) {
  console.log(`Building plugin: ${pluginName}...`);

  const pluginSrcDir = path.join(config.pluginsDir, pluginName);
  const pluginOutDir = path.join(config.outputCoreDir, 'plugins', pluginName);

  // Create plugins directory in core if it doesn't exist
  const pluginsDir = path.join(config.outputCoreDir, 'plugins');
  if (!fs.existsSync(pluginsDir)) {
    fs.mkdirSync(pluginsDir, { recursive: true });
  }

  // Create plugin output directory if it doesn't exist
  if (!fs.existsSync(pluginOutDir)) {
    fs.mkdirSync(pluginOutDir, { recursive: true });
  }

  // Check if the plugin has server-side code
  const serverSrcDir = path.join(pluginSrcDir, 'server');
  if (fs.existsSync(serverSrcDir)) {
    // Find all TypeScript files in the server directory
    const serverFiles = glob.sync(path.join(serverSrcDir, '**', '*.ts'));
    console.log(
      `Found ${serverFiles.length} TypeScript files in ${serverSrcDir}`
    );

    // Use esbuild to compile server-side code
    esbuild.buildSync({
      entryPoints:
        serverFiles.length > 0
          ? serverFiles
          : [path.join(serverSrcDir, 'index.ts')],
      outdir: path.join(pluginOutDir, 'server'),
      platform: 'node',
      target: 'es2020',
      format: 'esm',
      bundle: true,
      sourcemap: true,
      outExtension: { '.js': '.js' },
    });
  }

  // Check if the plugin has client-side code
  const clientSrcDir = path.join(pluginSrcDir, 'client');
  if (fs.existsSync(clientSrcDir)) {
    // Find all TypeScript files in the client directory
    const clientFiles = glob.sync(path.join(clientSrcDir, '**', '*.ts'));
    console.log(
      `Found ${clientFiles.length} TypeScript files in ${clientSrcDir}`
    );

    // Use esbuild to compile client-side code
    esbuild.buildSync({
      entryPoints:
        clientFiles.length > 0
          ? clientFiles
          : [path.join(clientSrcDir, 'index.ts')],
      outdir: path.join(pluginOutDir, 'client'),
      platform: 'browser',
      target: 'es2020',
      format: 'esm',
      bundle: true,
      sourcemap: true,
      outExtension: { '.js': '.js' },
    });

    // Copy HTML, CSS, and other assets
    copyFiles(
      path.join(clientSrcDir, '**', '*.{html,css,png,jpg,jpeg,gif,svg}'),
      path.join(pluginOutDir, 'client')
    );

    // Check if the plugin has client/html directory
    const clientHtmlSrcDir = path.join(clientSrcDir, 'html');
    if (fs.existsSync(clientHtmlSrcDir)) {
      // Create client/html directory
      const clientHtmlDir = path.join(pluginOutDir, 'client', 'html');
      if (!fs.existsSync(clientHtmlDir)) {
        fs.mkdirSync(clientHtmlDir, { recursive: true });
      }

      // Copy all files from client/html directory
      copyDirectory(clientHtmlSrcDir, clientHtmlDir);
    }
  }

  // Check if the plugin has shared code
  const sharedSrcDir = path.join(pluginSrcDir, 'shared');
  if (fs.existsSync(sharedSrcDir)) {
    // Create shared directory if it doesn't exist
    const sharedDir = path.join(pluginOutDir, 'shared');
    if (!fs.existsSync(sharedDir)) {
      fs.mkdirSync(sharedDir, { recursive: true });
    }

    // Find all TypeScript files in the shared directory
    const sharedFiles = glob.sync(path.join(sharedSrcDir, '**', '*.ts'));
    console.log(
      `Found ${sharedFiles.length} TypeScript files in ${sharedSrcDir}`
    );

    // Use esbuild to compile shared code
    esbuild.buildSync({
      entryPoints:
        sharedFiles.length > 0
          ? sharedFiles
          : [path.join(sharedSrcDir, 'index.ts')],
      outdir: sharedDir,
      platform: 'neutral',
      target: 'es2020',
      format: 'esm',
      bundle: true,
      sourcemap: true,
      outExtension: { '.js': '.js' },
    });
  }

  // We don't need to copy resource.toml anymore as plugins are part of the core resource
  // But we'll save the plugin metadata for the core to use
  const pluginMetadataPath = path.join(pluginOutDir, 'metadata.json');
  const metadata = {
    id: pluginName,
    name: pluginName,
    version: '1.0.0',
    dependencies: ['core'],
  };

  // Try to read metadata from resource.toml if it exists
  const resourceToml = path.join(pluginSrcDir, 'resource.toml');
  if (fs.existsSync(resourceToml)) {
    try {
      const tomlContent = fs.readFileSync(resourceToml, 'utf8');
      // Extract basic metadata from TOML (simple approach)
      const nameMatch = tomlContent.match(/name\s*=\s*"([^"]+)"/i);
      const versionMatch = tomlContent.match(/version\s*=\s*"([^"]+)"/i);
      const depsMatch = tomlContent.match(/deps\s*=\s*\[([^\]]+)\]/i);

      if (nameMatch && nameMatch[1]) metadata.name = nameMatch[1];
      if (versionMatch && versionMatch[1]) metadata.version = versionMatch[1];
      if (depsMatch && depsMatch[1]) {
        const deps = depsMatch[1]
          .split(',')
          .map((d) => d.trim().replace(/"/g, ''));
        metadata.dependencies = deps;
      }
    } catch (error) {
      console.error(
        `Error parsing resource.toml for ${pluginName}: ${error.message}`
      );
    }
  }

  // Save the metadata
  fs.writeFileSync(pluginMetadataPath, JSON.stringify(metadata, null, 2));

  console.log(`Plugin ${pluginName} built successfully!`);
}

/**
 * Copy files from source to destination
 * @param {string} srcGlob The glob pattern for source files
 * @param {string} outDir The output directory
 */
function copyFiles(srcGlob, outDir) {
  try {
    // Convert Unix-style paths to Windows-style paths if needed
    const normalizedSrcGlob = srcGlob.replace(/\//g, path.sep);

    // Get the base directory and pattern from the glob
    const parts = normalizedSrcGlob.split('**');
    const baseDir = parts[0];
    const pattern = parts.length > 1 ? parts[1].substring(1) : ''; // Remove leading path separator

    // Check if the directory exists
    if (!fs.existsSync(baseDir)) {
      console.log(`Base directory not found: ${baseDir}`);
      return;
    }

    // Find all matching files in the directory
    const files = [];
    const walkSync = (dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walkSync(fullPath);
        } else if (
          pattern === '' ||
          entry.name.match(pattern.replace(/\*\./g, '.*\\.'))
        ) {
          files.push(fullPath);
        }
      }
    };

    walkSync(baseDir);

    if (files.length === 0) {
      console.log(`No files found in: ${baseDir} matching pattern: ${pattern}`);
      return;
    }

    console.log(`Found ${files.length} files to copy from ${baseDir}`);

    // Copy each file
    for (const file of files) {
      const relativePath = path.relative(baseDir, file);
      const destPath = path.join(outDir, relativePath);

      // Ensure output directory exists
      fs.ensureDirSync(path.dirname(destPath));

      // Copy the file
      fs.copySync(file, destPath);
    }
  } catch (error) {
    console.error(`Error copying files: ${error.message}`);
  }
}

/**
 * Copy an entire directory recursively
 * @param {string} srcDir The source directory
 * @param {string} destDir The destination directory
 */
function copyDirectory(srcDir, destDir) {
  try {
    // Check if the source directory exists
    if (!fs.existsSync(srcDir)) {
      console.log(`Source directory not found: ${srcDir}`);
      return;
    }

    // Ensure the destination directory exists
    fs.ensureDirSync(destDir);

    // Copy the directory recursively
    fs.copySync(srcDir, destDir, {
      recursive: true,
      overwrite: true,
    });

    console.log(`Copied directory from ${srcDir} to ${destDir}`);
  } catch (error) {
    console.error(`Error copying directory: ${error.message}`);
  }
}

/**
 * Start the AltV server
 */
function startServer() {
  console.log('Starting AltV server...');

  // Start the server
  const server = spawn(config.serverExe, [], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
  });

  // Handle server exit
  server.on('exit', (code) => {
    console.log(`Server exited with code ${code}`);
    process.exit(code);
  });

  // Handle process exit
  process.on('exit', () => {
    server.kill();
  });

  console.log('AltV server started successfully!');
}

/**
 * Trigger a reload in the server
 * @param {string[]} resources The resources to reload
 */
function triggerReload(resources) {
  console.log(`Triggering reload for resources: ${resources.join(', ')}`);

  // Since all plugins are now part of the core resource,
  // we only need to reload the core resource
  // But we'll pass the plugin IDs to the core so it knows what to reload internally

  // TODO: Implement a way to communicate with the server to trigger reloads
  // This could be done via a REST API, WebSocket, or other IPC mechanism
  // For now, we'll just restart the core resource

  console.log('Reloading core resource...');

  // In a real implementation, we would send a message to the server
  // to reload the specific plugins within the core resource

  console.log('Reload triggered successfully!');
}

// Check if this script is being run directly
if (require.main === module) {
  // Start the hot reload system
  startHotReload();
}

module.exports = { startHotReload };
