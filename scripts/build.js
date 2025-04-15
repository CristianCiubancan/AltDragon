/**
 * Build script for the AltV project
 * Handles compilation of TypeScript code and copying of resources
 */

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

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

  // TypeScript configuration
  tsConfig: path.join(__dirname, '..', 'tsconfig.json'),
};

/**
 * Main build function
 * @param {boolean} production Whether to build for production
 */
function build(production = false) {
  console.log(`Building for ${production ? 'production' : 'development'}...`);

  // Ensure output directories exist
  ensureDirectories();

  // Build the core resource
  buildCore();

  // Build all plugins
  buildPlugins();

  console.log('Build completed successfully!');
}

/**
 * Ensure all necessary directories exist
 */
function ensureDirectories() {
  // Create resources directory if it doesn't exist
  if (!fs.existsSync(config.resourcesDir)) {
    fs.mkdirSync(config.resourcesDir);
  }

  // Create main directory if it doesn't exist
  if (!fs.existsSync(config.mainDir)) {
    fs.mkdirSync(config.mainDir);
  }

  // Create output core directory if it doesn't exist
  if (!fs.existsSync(config.outputCoreDir)) {
    fs.mkdirSync(config.outputCoreDir);
  }

  // Create output plugins directory if it doesn't exist
  if (!fs.existsSync(config.outputPluginsDir)) {
    fs.mkdirSync(config.outputPluginsDir);
  }
}

/**
 * Build the core resource
 */
function buildCore() {
  console.log('Building core resource...');

  // Create server directory
  const serverDir = path.join(config.outputCoreDir, 'server');
  if (!fs.existsSync(serverDir)) {
    fs.mkdirSync(serverDir);
  }

  // Create client directory
  const clientDir = path.join(config.outputCoreDir, 'client');
  if (!fs.existsSync(clientDir)) {
    fs.mkdirSync(clientDir);
  }

  // Compile server-side TypeScript
  compileTypeScript(
    path.join(config.coreDir, 'server', '**', '*.ts'),
    serverDir
  );

  // Compile client-side TypeScript
  compileTypeScript(
    path.join(config.coreDir, 'client', '**', '*.ts'),
    clientDir
  );

  // Copy resource.toml
  fs.copyFileSync(
    path.join(config.coreDir, 'resource.toml'),
    path.join(config.outputCoreDir, 'resource.toml')
  );

  console.log('Core resource built successfully!');
}

/**
 * Build all plugins
 */
function buildPlugins() {
  console.log('Building plugins...');

  // Get all plugin directories
  const pluginDirs = fs
    .readdirSync(config.pluginsDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  // Build each plugin
  for (const pluginName of pluginDirs) {
    buildPlugin(pluginName);
  }

  console.log(`Built ${pluginDirs.length} plugins successfully!`);
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
    fs.mkdirSync(pluginsDir);
  }

  // Create plugin output directory if it doesn't exist
  if (!fs.existsSync(pluginOutDir)) {
    fs.mkdirSync(pluginOutDir);
  }

  // Create server directory
  const serverDir = path.join(pluginOutDir, 'server');
  if (!fs.existsSync(serverDir)) {
    fs.mkdirSync(serverDir);
  }

  // Create client directory
  const clientDir = path.join(pluginOutDir, 'client');
  if (!fs.existsSync(clientDir)) {
    fs.mkdirSync(clientDir);
  }

  // Create shared directory if needed
  const sharedDir = path.join(pluginOutDir, 'shared');

  // Check if the plugin has server-side code
  const serverSrcDir = path.join(pluginSrcDir, 'server');
  if (fs.existsSync(serverSrcDir)) {
    // Compile server-side TypeScript
    compileTypeScript(path.join(serverSrcDir, '**', '*.ts'), serverDir);

    // Copy any JavaScript files
    copyFiles(path.join(serverSrcDir, '**', '*.js'), serverDir);
  }

  // Check if the plugin has client-side code
  const clientSrcDir = path.join(pluginSrcDir, 'client');
  if (fs.existsSync(clientSrcDir)) {
    // Compile client-side TypeScript
    compileTypeScript(path.join(clientSrcDir, '**', '*.ts'), clientDir);

    // Copy any JavaScript files
    copyFiles(path.join(clientSrcDir, '**', '*.js'), clientDir);

    // Copy HTML, CSS, and other assets
    copyFiles(
      path.join(clientSrcDir, '**', '*.{html,css,png,jpg,jpeg,gif,svg}'),
      clientDir
    );

    // Check if the plugin has client/html directory
    const clientHtmlSrcDir = path.join(clientSrcDir, 'html');
    if (fs.existsSync(clientHtmlSrcDir)) {
      // Create client/html directory
      const clientHtmlDir = path.join(clientDir, 'html');
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
    if (!fs.existsSync(sharedDir)) {
      fs.mkdirSync(sharedDir);
    }

    // Compile shared TypeScript
    compileTypeScript(path.join(sharedSrcDir, '**', '*.ts'), sharedDir);

    // Copy any JavaScript files
    copyFiles(path.join(sharedSrcDir, '**', '*.js'), sharedDir);
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
 * Compile TypeScript files
 * @param {string} srcGlob The glob pattern for source files
 * @param {string} outDir The output directory
 */
function compileTypeScript(srcGlob, outDir) {
  try {
    // Use esbuild to compile TypeScript (more reliable cross-platform)
    const esbuild = require('esbuild');

    // Convert Unix-style paths to Windows-style paths if needed
    const normalizedSrcGlob = srcGlob.replace(/\//g, path.sep);

    // Get the base directory from the glob pattern
    const baseDir = normalizedSrcGlob.split('**')[0];

    // Check if the directory exists
    if (!fs.existsSync(baseDir)) {
      console.log(`Base directory not found: ${baseDir}`);
      return;
    }

    // Find all TypeScript files in the directory
    const files = [];
    const walkSync = (dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walkSync(fullPath);
        } else if (
          entry.name.endsWith('.ts') &&
          !entry.name.endsWith('.d.ts')
        ) {
          files.push(fullPath);
        }
      }
    };

    walkSync(baseDir);

    if (files.length === 0) {
      console.log(`No TypeScript files found in: ${baseDir}`);
      return;
    }

    console.log(`Found ${files.length} TypeScript files in ${baseDir}`);

    for (const file of files) {
      // Determine output path
      const relativePath = path.relative(baseDir, file);
      const outputPath = path.join(outDir, relativePath.replace('.ts', '.js'));

      // Ensure output directory exists
      fs.ensureDirSync(path.dirname(outputPath));

      // Compile the file
      const result = esbuild.buildSync({
        entryPoints: [file],
        outfile: outputPath,
        platform: file.includes('client' + path.sep) ? 'browser' : 'node',
        target: 'es2020',
        format: 'esm',
        bundle: true, // Changed to true to support external
        sourcemap: true,
        // Define globalThis for browser platform to ensure compatibility
        define: file.includes('client' + path.sep)
          ? { 'window': 'globalThis' }
          : {},
        // Mark AltV modules as external
        external: file.includes('client' + path.sep)
          ? ['alt-client', 'alt-shared', 'natives']
          : file.includes('server' + path.sep)
          ? ['alt-server', 'alt-shared', 'natives']
          : ['alt-shared'],
      });

      if (result.errors && result.errors.length > 0) {
        console.error(`Error compiling ${file}: ${result.errors.join('\n')}`);
      }
    }
  } catch (error) {
    console.error(`Error compiling TypeScript: ${error.message}`);
  }
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

// Check if this script is being run directly
if (require.main === module) {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const production = args.includes('--production');

  // Run the build
  build(production);
}

module.exports = { build };
