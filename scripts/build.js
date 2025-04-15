/**
 * Improved build script for the AltV project
 * Handles compilation of TypeScript code and copying of resources
 * Cross-platform compatible for both Windows and Linux
 */

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const glob = require('glob');
const esbuild = require('esbuild');

// Configuration
const config = {
  // Source directories
  srcDir: path.join(__dirname, '..', 'src'),
  coreDir: path.join(__dirname, '..', 'src', 'core'),
  pluginsDir: path.join(__dirname, '..', 'src', 'plugins'),

  // Output directories
  resourcesDir: path.join(__dirname, '..', 'resources'),
  outputCoreDir: path.join(__dirname, '..', 'resources', 'core'),
  
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
  fs.ensureDirSync(config.resourcesDir);

  // Create main directory if it doesn't exist
  fs.ensureDirSync(config.mainDir);

  // Create output core directory if it doesn't exist
  fs.ensureDirSync(config.outputCoreDir);

  // Create output plugins directory if it doesn't exist
  fs.ensureDirSync(config.outputPluginsDir);
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

    // Create plugins directory in core if it doesn't exist
    const pluginsDir = path.join(config.outputCoreDir, 'plugins');
    fs.ensureDirSync(pluginsDir);

    // Compile server-side TypeScript
    compileTypeScript(
      path.join(config.coreDir, 'server', '**', '*.ts'),
      serverDir,
      'server'
    );

    // Compile client-side TypeScript
    compileTypeScript(
      path.join(config.coreDir, 'client', '**', '*.ts'),
      clientDir,
      'client'
    );

    // Compile shared TypeScript if it exists
    const sharedSrcDir = path.join(config.coreDir, 'shared');
    if (fs.existsSync(sharedSrcDir)) {
      compileTypeScript(
        path.join(sharedSrcDir, '**', '*.ts'),
        sharedDir,
        'shared'
      );
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
 * Build all plugins as separate alt:V resources
 * @returns {boolean} Whether all plugins were built successfully
 */
function buildPlugins() {
  console.log('Building plugins as separate resources...');

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
    const builtPlugins = [];

    for (const pluginName of pluginDirs) {
      const result = buildPlugin(pluginName);
      if (result.success) {
        successCount++;
        builtPlugins.push({
          name: pluginName,
        });
      } else {
        failureCount++;
        failedPlugins.push(pluginName);
      }
    }

    // Print the list of built plugins
    console.log('\nBuilt plugins:');
    builtPlugins.forEach((plugin) => {
      console.log(`- ${plugin.name} (as standalone resource)`);
    });

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
      console.log(`Built ${successCount} plugins successfully as standalone resources!`);
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
 * Update the core resource.toml file with plugin client and server files
 * @param {string[]} clientFiles Array of client file patterns
 * @param {string[]} serverFiles Array of server file patterns
 */
function updateCoreResourceToml(clientFiles, serverFiles = []) {
  try {
    const resourceTomlPath = path.join(config.outputCoreDir, 'resource.toml');

    if (!fs.existsSync(resourceTomlPath)) {
      console.error(`Core resource.toml not found at ${resourceTomlPath}`);
      return;
    }

    let tomlContent = fs.readFileSync(resourceTomlPath, 'utf8');

    // Parse the current client-files array
    const clientFilesMatch = tomlContent.match(
      /client-files\s*=\s*\[([^\]]+)\]/s
    );
    if (!clientFilesMatch) {
      console.error('Could not find client-files in resource.toml');
      return;
    }

    // Create a new client-files array with core files and plugin files
    const coreClientFiles = ['"client/*"'];
    const pluginClientFiles = clientFiles.map((file) => `"${file}"`);
    const allClientFiles = [
      ...new Set([...coreClientFiles, ...pluginClientFiles]),
    ];

    // Format the new client-files array
    const newClientFilesStr = allClientFiles.join(', ');

    // Replace the client-files array in the TOML content
    let newTomlContent = tomlContent.replace(
      /client-files\s*=\s*\[([^\]]+)\]/s,
      `client-files = [${newClientFilesStr}]`
    );

    // Add server-files if they exist
    if (serverFiles.length > 0) {
      // Check if server-files already exists in the TOML
      const serverFilesMatch = newTomlContent.match(
        /server-files\s*=\s*\[([^\]]+)\]/s
      );

      // Format the server files array
      const serverFilesStr = serverFiles.map((file) => `"${file}"`).join(', ');

      if (serverFilesMatch) {
        // Update existing server-files entry
        newTomlContent = newTomlContent.replace(
          /server-files\s*=\s*\[([^\]]+)\]/s,
          `server-files = [${serverFilesStr}]`
        );
      } else {
        // Add new server-files entry after main
        newTomlContent = newTomlContent.replace(
          /(main\s*=\s*"[^"]+")/,
          `$1\nserver-files = [${serverFilesStr}]`
        );
      }

      console.log(
        `Added ${serverFiles.length} server file patterns to resource.toml`
      );
    }

    // Write the updated TOML content back to the file
    fs.writeFileSync(resourceTomlPath, newTomlContent);

    console.log(
      `Updated core resource.toml with ${allClientFiles.length} client file patterns`
    );
  } catch (error) {
    console.error(`Error updating core resource.toml: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

/**
 * Build a specific plugin as a separate alt:V resource
 * @param {string} pluginName The name of the plugin to build
 * @returns {Object} Build result with success status
 */
function buildPlugin(pluginName) {
  console.log(`Building plugin: ${pluginName}...`);

  try {
    const pluginSrcDir = path.join(config.pluginsDir, pluginName);

    // Check if the plugin source directory exists
    if (!fs.existsSync(pluginSrcDir)) {
      console.error(`Plugin source directory not found: ${pluginSrcDir}`);
      return { success: false };
    }

    // Create a separate resource directory for this plugin
    const pluginOutDir = path.join(config.resourcesDir, pluginName);
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
      compileTypeScript(
        path.join(serverSrcDir, '**', '*.ts'),
        serverDir,
        'server'
      );

      // Copy any JavaScript files
      copyFiles(path.join(serverSrcDir, '**', '*.js'), serverDir);
    }

    // Check if the plugin has client-side code
    const clientSrcDir = path.join(pluginSrcDir, 'client');
    if (fs.existsSync(clientSrcDir)) {
      // Compile client-side TypeScript
      compileTypeScript(
        path.join(clientSrcDir, '**', '*.ts'),
        clientDir,
        'client'
      );

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
      compileTypeScript(
        path.join(sharedSrcDir, '**', '*.ts'),
        sharedDir,
        'shared'
      );

      // Copy any JavaScript files
      copyFiles(path.join(sharedSrcDir, '**', '*.js'), sharedDir);
    }

    // Create a resource.toml file for this plugin
    const pluginResourceToml = path.join(pluginOutDir, 'resource.toml');
    
    // Start with default values
    let resourceTomlContent = `# ${pluginName} resource configuration
type = "js"
main = "server/index.js"
client-main = "client/index.js"
client-files = ["client/*", "shared/*"]
deps = ["core"]
name = "${pluginName}"
version = "1.0.0"
`;

    // Try to read metadata from source resource.toml if it exists
    const srcResourceToml = path.join(pluginSrcDir, 'resource.toml');
    if (fs.existsSync(srcResourceToml)) {
      try {
        const tomlContent = fs.readFileSync(srcResourceToml, 'utf8');
        // Extract basic metadata from TOML (simple approach)
        const nameMatch = tomlContent.match(/name\s*=\s*"([^"]+)"/i);
        const versionMatch = tomlContent.match(/version\s*=\s*"([^"]+)"/i);
        const depsMatch = tomlContent.match(/deps\s*=\s*\[([^\]]+)\]/i);
        const authorMatch = tomlContent.match(/author\s*=\s*"([^"]+)"/i);
        const descMatch = tomlContent.match(/description\s*=\s*"([^"]+)"/i);

        // Update the resource.toml content with extracted values
        if (nameMatch && nameMatch[1]) {
          resourceTomlContent = resourceTomlContent.replace(`name = "${pluginName}"`, `name = "${nameMatch[1]}"`);
        }
        
        if (versionMatch && versionMatch[1]) {
          resourceTomlContent = resourceTomlContent.replace(`version = "1.0.0"`, `version = "${versionMatch[1]}"`);
        }
        
        if (authorMatch && authorMatch[1]) {
          resourceTomlContent += `author = "${authorMatch[1]}"\n`;
        }
        
        if (descMatch && descMatch[1]) {
          resourceTomlContent += `description = "${descMatch[1]}"\n`;
        }
        
        if (depsMatch && depsMatch[1]) {
          const deps = depsMatch[1]
            .split(',')
            .map((d) => d.trim().replace(/"/g, ''));
            
          // Always ensure core is a dependency
          if (!deps.includes('core')) {
            deps.push('core');
          }
          
          const depsStr = deps.map(d => `"${d}"`).join(', ');
          resourceTomlContent = resourceTomlContent.replace(`deps = ["core"]`, `deps = [${depsStr}]`);
        }
      } catch (error) {
        console.error(
          `Error parsing resource.toml for ${pluginName}: ${error.message}`
        );
      }
    }
    
    // Write the resource.toml file
    fs.writeFileSync(pluginResourceToml, resourceTomlContent);

    // Also create a metadata.json file for potential use by the core 
    const pluginMetadataPath = path.join(pluginOutDir, 'metadata.json');
    const metadata = {
      id: pluginName,
      name: pluginName,
      version: '1.0.0',
      dependencies: ['core'],
      supportsHotReload: true,
      isStandaloneResource: true
    };
    
    // Save the metadata
    fs.writeFileSync(pluginMetadataPath, JSON.stringify(metadata, null, 2));

    console.log(`Plugin ${pluginName} built successfully as standalone resource!`);
    return { success: true };
  } catch (error) {
    console.error(`Error building plugin ${pluginName}: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
    return { success: false };
  }
}

/**
 * Compile TypeScript files using esbuild
 * @param {string} srcGlob The glob pattern for source files
 * @param {string} outDir The output directory
 * @param {string} type The type of code ('server', 'client', or 'shared')
 */
function compileTypeScript(srcGlob, outDir, type = 'server') {
  try {
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

    // Determine platform and externals based on type
    const platform = type === 'client' ? 'browser' : 'node';
    let externals = [];

    if (type === 'client') {
      externals = ['alt-client', 'alt-shared', 'natives'];
    } else if (type === 'server') {
      externals = ['alt-server', 'alt-shared', 'natives'];
    } else {
      externals = ['alt-shared'];
    }

    // Compile all files at once with esbuild
    const result = esbuild.buildSync({
      entryPoints: files,
      outdir: outDir,
      platform: platform,
      target: 'es2020',
      format: 'esm',
      bundle: true,
      sourcemap: true,
      outExtension: { '.js': '.js' },
      // Define globalThis for browser platform to ensure compatibility
      define: type === 'client' ? { 'window': 'globalThis' } : {},
      // Mark AltV modules as external
      external: externals,
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

    // Use glob to find files (more reliable cross-platform)
    const files = glob.sync(normalizedSrcGlob, { nodir: true });

    if (files.length === 0) {
      console.log(`No files found matching: ${normalizedSrcGlob}`);
      return;
    }

    console.log(
      `Found ${files.length} files to copy from ${normalizedSrcGlob}`
    );

    // Ensure output directory exists
    fs.ensureDirSync(outDir);

    // Copy each file
    let copiedCount = 0;
    for (const file of files) {
      try {
        // Get the base directory from the glob pattern
        const parts = normalizedSrcGlob.split('**');
        const baseDir = parts[0];

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
