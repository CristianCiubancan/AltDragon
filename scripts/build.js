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
 * @returns {boolean} Whether the build was successful
 */
function build(production = false) {
  console.log(`Building for ${production ? 'production' : 'development'}...`);

  try {
    // Ensure output directories exist
    ensureDirectories();

    // Build the core resource
    const coreSuccess = buildCore();
    if (!coreSuccess) {
      console.error('Failed to build core resource');
      return false;
    }

    // Build all plugins
    const pluginsSuccess = buildPlugins();
    if (!pluginsSuccess) {
      console.error('Failed to build all plugins');
      // We continue anyway since some plugins might have built successfully
    }

    console.log('Build completed successfully!');
    return true;
  } catch (error) {
    console.error(`Build failed: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
    return false;
  }
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
 * @returns {boolean} Whether the build was successful
 */
function buildCore() {
  console.log('Building core resource...');

  try {
    // Check if the core directory exists
    if (!fs.existsSync(config.coreDir)) {
      console.error(`Core directory not found: ${config.coreDir}`);
      return false;
    }

    // Create server directory
    const serverDir = path.join(config.outputCoreDir, 'server');
    fs.ensureDirSync(serverDir);

    // Create client directory
    const clientDir = path.join(config.outputCoreDir, 'client');
    fs.ensureDirSync(clientDir);

    // Create shared directory if needed
    const sharedDir = path.join(config.outputCoreDir, 'shared');
    fs.ensureDirSync(sharedDir);

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

    // Compile shared TypeScript if it exists
    const sharedSrcDir = path.join(config.coreDir, 'shared');
    if (fs.existsSync(sharedSrcDir)) {
      compileTypeScript(path.join(sharedSrcDir, '**', '*.ts'), sharedDir);
    }

    // Check if resource.toml exists
    const resourceTomlPath = path.join(config.coreDir, 'resource.toml');
    if (!fs.existsSync(resourceTomlPath)) {
      console.error(`Core resource.toml not found: ${resourceTomlPath}`);
      // Create a default resource.toml if it doesn't exist
      const defaultResourceToml = `# Core resource configuration
type = "js"
main = "server/index.js"
client-main = "client/index.js"
client-files = [ "client/*" ]
name = "core"
version = "1.0.0"
description = "Core resource for AltV"
author = "AltV Developer"
deps = []
`;
      fs.writeFileSync(resourceTomlPath, defaultResourceToml);
      console.log(`Created default resource.toml at ${resourceTomlPath}`);
    }

    // Copy resource.toml
    fs.copyFileSync(
      resourceTomlPath,
      path.join(config.outputCoreDir, 'resource.toml')
    );

    console.log('Core resource built successfully!');
    return true;
  } catch (error) {
    console.error(`Error building core resource: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
    return false;
  }
}

/**
 * Build all plugins
 * @returns {boolean} Whether all plugins were built successfully
 */
function buildPlugins() {
  console.log('Building plugins...');

  try {
    // Get all plugin directories
    const pluginDirs = fs
      .readdirSync(config.pluginsDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    if (pluginDirs.length === 0) {
      console.log('No plugins found in plugins directory');
      return true;
    }

    console.log(`Found ${pluginDirs.length} plugins to build`);

    // Build each plugin and track success/failure
    let successCount = 0;
    let failureCount = 0;
    const failedPlugins = [];

    for (const pluginName of pluginDirs) {
      const success = buildPlugin(pluginName);
      if (success) {
        successCount++;
      } else {
        failureCount++;
        failedPlugins.push(pluginName);
      }
    }

    // Report results
    if (failureCount > 0) {
      console.error(
        `Failed to build ${failureCount} plugins: ${failedPlugins.join(', ')}`
      );
      console.log(
        `Built ${successCount} of ${pluginDirs.length} plugins successfully`
      );
      return false;
    } else {
      console.log(`Built ${successCount} plugins successfully!`);
      return true;
    }
  } catch (error) {
    console.error(`Error building plugins: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
    return false;
  }
}

/**
 * Build a specific plugin
 * @param {string} pluginName The name of the plugin to build
 * @returns {boolean} Whether the build was successful
 */
function buildPlugin(pluginName) {
  console.log(`Building plugin: ${pluginName}...`);

  try {
    const pluginSrcDir = path.join(config.pluginsDir, pluginName);

    // Check if the plugin source directory exists
    if (!fs.existsSync(pluginSrcDir)) {
      console.error(`Plugin source directory not found: ${pluginSrcDir}`);
      return false;
    }

    const pluginOutDir = path.join(config.outputCoreDir, 'plugins', pluginName);

    // Create plugins directory in core if it doesn't exist
    const pluginsDir = path.join(config.outputCoreDir, 'plugins');
    fs.ensureDirSync(pluginsDir);

    // Create plugin output directory if it doesn't exist
    fs.ensureDirSync(pluginOutDir);

    // Create server directory
    const serverDir = path.join(pluginOutDir, 'server');
    fs.ensureDirSync(serverDir);

    // Create client directory
    const clientDir = path.join(pluginOutDir, 'client');
    fs.ensureDirSync(clientDir);

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
        fs.ensureDirSync(clientHtmlDir);

        // Copy all files from client/html directory
        copyDirectory(clientHtmlSrcDir, clientHtmlDir);
      }
    }

    // Check if the plugin has shared code
    const sharedSrcDir = path.join(pluginSrcDir, 'shared');
    if (fs.existsSync(sharedSrcDir)) {
      // Create shared directory if it doesn't exist
      fs.ensureDirSync(sharedDir);

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
      supportsHotReload: true,
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
        const authorMatch = tomlContent.match(/author\s*=\s*"([^"]+)"/i);
        const descMatch = tomlContent.match(/description\s*=\s*"([^"]+)"/i);

        if (nameMatch && nameMatch[1]) metadata.name = nameMatch[1];
        if (versionMatch && versionMatch[1]) metadata.version = versionMatch[1];
        if (authorMatch && authorMatch[1]) metadata.author = authorMatch[1];
        if (descMatch && descMatch[1]) metadata.description = descMatch[1];
        if (depsMatch && depsMatch[1]) {
          const deps = depsMatch[1]
            .split(',')
            .map((d) => d.trim().replace(/"/g, ''));
          metadata.dependencies = deps;

          // Always ensure core is a dependency
          if (!metadata.dependencies.includes('core')) {
            metadata.dependencies.push('core');
          }
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
    return true;
  } catch (error) {
    console.error(`Error building plugin ${pluginName}: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
    return false;
  }
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

    // Normalize path separators for cross-platform compatibility
    const normalizedSrcGlob = srcGlob.replace(/[\\/]/g, path.sep);

    // Get the base directory from the glob pattern
    const parts = normalizedSrcGlob.split('**');
    const baseDir = parts[0];

    // Check if the directory exists
    if (!fs.existsSync(baseDir)) {
      console.log(`Base directory not found: ${baseDir}`);
      return;
    }

    // Find all TypeScript files in the directory
    const files = [];
    const walkSync = (dir) => {
      try {
        if (!fs.existsSync(dir)) {
          console.log(`Directory not found: ${dir}`);
          return;
        }

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
      } catch (err) {
        console.error(`Error walking directory ${dir}: ${err.message}`);
      }
    };

    walkSync(baseDir);

    if (files.length === 0) {
      console.log(`No TypeScript files found in: ${baseDir}`);
      return;
    }

    console.log(`Found ${files.length} TypeScript files in ${baseDir}`);

    // Ensure output directory exists
    fs.ensureDirSync(outDir);

    // Compile all files at once with esbuild
    const result = esbuild.buildSync({
      entryPoints: files,
      outdir: outDir,
      platform: normalizedSrcGlob.includes('client') ? 'browser' : 'node',
      target: 'es2020',
      format: 'esm',
      bundle: true,
      sourcemap: true,
      outExtension: { '.js': '.js' },
      // Define globalThis for browser platform to ensure compatibility
      define: normalizedSrcGlob.includes('client')
        ? { 'window': 'globalThis' }
        : {},
      // Mark AltV modules as external
      external: normalizedSrcGlob.includes('client')
        ? ['alt-client', 'alt-shared', 'natives']
        : normalizedSrcGlob.includes('server')
        ? ['alt-server', 'alt-shared', 'natives']
        : ['alt-shared'],
      logLevel: 'warning',
    });

    if (result.errors && result.errors.length > 0) {
      console.error(`Compilation errors:`);
      result.errors.forEach((err) => console.error(err));
    } else {
      console.log(
        `Successfully compiled ${files.length} TypeScript files to ${outDir}`
      );
    }
  } catch (error) {
    console.error(`Error compiling TypeScript: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
    if (error.errors) {
      error.errors.forEach((err) => console.error(err));
    }
    if (error.warnings) {
      error.warnings.forEach((warn) => console.warn(warn));
    }
  }
}

/**
 * Copy files from source to destination
 * @param {string} srcGlob The glob pattern for source files
 * @param {string} outDir The output directory
 */
function copyFiles(srcGlob, outDir) {
  try {
    // Normalize path separators for cross-platform compatibility
    const normalizedSrcGlob = srcGlob.replace(/[\\/]/g, path.sep);

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
      try {
        if (!fs.existsSync(dir)) {
          console.log(`Directory not found: ${dir}`);
          return;
        }

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
      } catch (err) {
        console.error(`Error walking directory ${dir}: ${err.message}`);
      }
    };

    walkSync(baseDir);

    if (files.length === 0) {
      console.log(`No files found in: ${baseDir} matching pattern: ${pattern}`);
      return;
    }

    console.log(`Found ${files.length} files to copy from ${baseDir}`);

    // Ensure output directory exists
    fs.ensureDirSync(outDir);

    // Copy each file
    let copiedCount = 0;
    for (const file of files) {
      try {
        const relativePath = path.relative(baseDir, file);
        const destPath = path.join(outDir, relativePath);

        // Ensure output directory exists
        fs.ensureDirSync(path.dirname(destPath));

        // Copy the file
        fs.copySync(file, destPath);
        copiedCount++;
      } catch (err) {
        console.error(`Error copying file ${file}: ${err.message}`);
      }
    }

    console.log(`Successfully copied ${copiedCount} files to ${outDir}`);
  } catch (error) {
    console.error(`Error copying files: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

/**
 * Copy an entire directory recursively
 * @param {string} srcDir The source directory
 * @param {string} destDir The destination directory
 */
function copyDirectory(srcDir, destDir) {
  try {
    // Normalize paths for cross-platform compatibility
    const normalizedSrcDir = srcDir.replace(/[\\/]/g, path.sep);
    const normalizedDestDir = destDir.replace(/[\\/]/g, path.sep);

    // Check if the source directory exists
    if (!fs.existsSync(normalizedSrcDir)) {
      console.log(`Source directory not found: ${normalizedSrcDir}`);
      return;
    }

    // Ensure the destination directory exists
    fs.ensureDirSync(normalizedDestDir);

    try {
      // Copy the directory recursively
      fs.copySync(normalizedSrcDir, normalizedDestDir, {
        recursive: true,
        overwrite: true,
        errorOnExist: false,
      });

      console.log(
        `Copied directory from ${normalizedSrcDir} to ${normalizedDestDir}`
      );
    } catch (copyError) {
      console.error(`Error during directory copy: ${copyError.message}`);

      // Fallback to manual copy if fs-extra's copySync fails
      console.log(`Attempting manual directory copy...`);
      copyDirectoryManually(normalizedSrcDir, normalizedDestDir);
    }
  } catch (error) {
    console.error(`Error copying directory: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

/**
 * Manual implementation of directory copy for fallback
 * @param {string} srcDir The source directory
 * @param {string} destDir The destination directory
 */
function copyDirectoryManually(srcDir, destDir) {
  try {
    // Ensure destination directory exists
    fs.ensureDirSync(destDir);

    // Read all entries in the source directory
    const entries = fs.readdirSync(srcDir, { withFileTypes: true });

    // Process each entry
    for (const entry of entries) {
      const srcPath = path.join(srcDir, entry.name);
      const destPath = path.join(destDir, entry.name);

      if (entry.isDirectory()) {
        // Recursively copy subdirectories
        copyDirectoryManually(srcPath, destPath);
      } else {
        // Copy files
        fs.copyFileSync(srcPath, destPath);
      }
    }

    console.log(`Manually copied directory from ${srcDir} to ${destDir}`);
  } catch (error) {
    console.error(`Error in manual directory copy: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
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

module.exports = { build, buildCore, buildPlugin, buildPlugins };
