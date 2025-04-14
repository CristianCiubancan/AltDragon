#!/usr/bin/env node

// Cross-platform plugin deployment script for Windows and Linux

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = process.cwd();
const pluginsDir = path.join(rootDir, 'plugins');
const resourcesDir = path.join(rootDir, 'resources');
const mainDir = path.join(resourcesDir, 'main');
const serverTomlPath = path.join(rootDir, 'server.toml');

// Function to delete a directory recursively
function deleteDirectory(dirPath) {
  try {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
      console.log(`Deleted directory: ${dirPath}`);
    }
  } catch (error) {
    console.error(`Error deleting directory ${dirPath}:`, error.message);
    // Continue execution despite errors
  }
}

// Function to copy a directory recursively
function copyDirectory(source, destination) {
  try {
    // Create the destination directory if it doesn't exist
    if (!fs.existsSync(destination)) {
      fs.mkdirSync(destination, { recursive: true });
    }

    // Get all files and directories in the source directory
    const entries = fs.readdirSync(source, { withFileTypes: true });

    for (const entry of entries) {
      try {
        const sourcePath = path.join(source, entry.name);
        const destPath = path.join(destination, entry.name);

        if (entry.isDirectory()) {
          // Recursively copy subdirectories
          copyDirectory(sourcePath, destPath);
        } else {
          // Copy files
          fs.copyFileSync(sourcePath, destPath);
        }
      } catch (err) {
        console.error(`Error copying ${entry.name}:`, err.message);
        // Continue with other files despite errors
      }
    }
  } catch (error) {
    console.error(`Error in copyDirectory for ${source} to ${destination}:`, error.message);
    // Continue execution despite errors
  }
}

// Function to read current plugins from server.toml
function getCurrentPluginsFromToml() {
  if (!fs.existsSync(serverTomlPath)) {
    console.error('server.toml not found at:', serverTomlPath);
    return [];
  }

  // Read the entire file
  const serverToml = fs.readFileSync(serverTomlPath, 'utf8');

  // Split the file into lines
  const lines = serverToml.split('\n');

  // Find the resources section
  let resourcesStartIndex = -1;
  let resourcesEndIndex = -1;
  let commentLineIndex = -1;
  const currentPlugins = [];

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('resources = [')) {
      resourcesStartIndex = i;
    } else if (resourcesStartIndex !== -1 && lines[i].trim() === ']') {
      resourcesEndIndex = i;
      break;
    } else if (resourcesStartIndex !== -1 && commentLineIndex !== -1) {
      // We're after the comment line, check for plugin entries
      const line = lines[i].trim();
      if (line.startsWith("'main/") && line.includes("'")) {
        // Extract plugin name from 'main/plugin_name'
        const match = line.match(/'main\/([^']+)'/);
        if (match && match[1]) {
          currentPlugins.push(match[1]);
        }
      }
    } else if (
      resourcesStartIndex !== -1 &&
      lines[i].trim().includes('# Plugins will be automatically added here')
    ) {
      commentLineIndex = i;
    }
  }

  return currentPlugins;
}

// Function to update server.toml with plugin entries
function updateServerToml(plugins) {
  console.log('Updating server.toml with plugins...');

  if (!fs.existsSync(serverTomlPath)) {
    console.error('server.toml not found at:', serverTomlPath);
    return;
  }

  // Get existing plugins
  const existingPlugins = getCurrentPluginsFromToml();

  // Calculate differences for reporting
  const addedPlugins = plugins.filter((p) => !existingPlugins.includes(p));
  const removedPlugins = existingPlugins.filter((p) => !plugins.includes(p));

  // Read the entire file
  let serverToml = fs.readFileSync(serverTomlPath, 'utf8');

  // Split the file into lines
  const lines = serverToml.split('\n');

  // Find the resources section start and end
  let resourcesStartIndex = -1;
  let resourcesEndIndex = -1;
  let commentLineIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('resources = [')) {
      resourcesStartIndex = i;
    } else if (resourcesStartIndex !== -1 && lines[i].trim() === ']') {
      resourcesEndIndex = i;
      break;
    } else if (
      resourcesStartIndex !== -1 &&
      lines[i].trim().includes('# Plugins will be automatically added here')
    ) {
      commentLineIndex = i;
    }
  }

  if (
    resourcesStartIndex === -1 ||
    resourcesEndIndex === -1 ||
    commentLineIndex === -1
  ) {
    console.error(
      'Could not find resources section with comment in server.toml'
    );
    return;
  }

  // Create new lines array
  const newLines = [];

  // Add lines up to and including the comment line
  for (let i = 0; i <= commentLineIndex; i++) {
    newLines.push(lines[i]);
  }

  // Add plugin entries
  if (plugins.length > 0) {
    plugins.forEach((plugin, index) => {
      newLines.push(
        `    'main/${plugin}'${index < plugins.length - 1 ? ',' : ''}`
      );
    });
  }

  // Add remaining lines from the end of resources section
  for (let i = resourcesEndIndex; i < lines.length; i++) {
    newLines.push(lines[i]);
  }

  // Join lines and write back to file
  fs.writeFileSync(serverTomlPath, newLines.join('\n'));

  // Report changes
  if (addedPlugins.length > 0) {
    console.log(`Added plugins to server.toml: ${addedPlugins.join(', ')}`);
  }
  if (removedPlugins.length > 0) {
    console.log(
      `Removed plugins from server.toml: ${removedPlugins.join(', ')}`
    );
  }
  console.log(`Total plugins in server.toml: ${plugins.length}`);
}

// Function to validate plugin resources
function validatePlugins() {
  if (!fs.existsSync(pluginsDir)) {
    console.warn('No plugins directory found');
    return [];
  }

  const validPlugins = [];
  const plugins = fs
    .readdirSync(pluginsDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  console.log(`Found ${plugins.length} potential plugin(s) to deploy`);

  // Check each plugin for required files
  for (const plugin of plugins) {
    const pluginDir = path.join(pluginsDir, plugin);
    const resourceTomlPath = path.join(pluginDir, 'resource.toml');

    if (!fs.existsSync(resourceTomlPath)) {
      console.log(`Skipping "${plugin}" - no resource.toml found`);
      continue;
    }

    validPlugins.push(plugin);
  }

  return validPlugins;
}

// Function to check for orphaned plugin folders in resources/main
function checkOrphanedPluginFolders(validPlugins) {
  if (!fs.existsSync(mainDir)) {
    return;
  }

  const existingDirs = fs
    .readdirSync(mainDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  const orphanedDirs = existingDirs.filter(
    (dir) => !validPlugins.includes(dir)
  );

  if (orphanedDirs.length > 0) {
    console.log(
      `Found ${orphanedDirs.length} orphaned plugin folder(s) in resources/main`
    );

    for (const dir of orphanedDirs) {
      console.log(`Removing orphaned plugin folder: ${dir}`);
      deleteDirectory(path.join(mainDir, dir));
    }
  }
}

// Function to set executable permissions on Linux
function setExecutablePermissions() {
  // Check if we're on Linux
  if (process.platform !== 'win32') {
    console.log('Setting executable permissions for Linux...');
    try {
      // Set executable permissions on the server binary
      const serverPath = path.join(rootDir, 'altv-server');
      if (fs.existsSync(serverPath)) {
        fs.chmodSync(serverPath, '755');
        console.log('Set executable permissions on altv-server');
      }
    } catch (error) {
      console.error('Error setting executable permissions:', error.message);
    }
  }
}

// Main function
function main() {
  console.log('Starting development deployment...');
  console.log(
    `Platform: ${process.platform === 'win32' ? 'Windows' : 'Linux/Unix'}`
  );

  // Step 1: Validate plugins
  const validPlugins = validatePlugins();
  console.log(`Validated ${validPlugins.length} plugin(s) for deployment`);

  // Step 2: Delete the resources/main directory if it exists
  console.log('Cleaning resources/main directory...');
  deleteDirectory(mainDir);

  // Step 3: Create the resources/main directory
  fs.mkdirSync(mainDir, { recursive: true });
  console.log('Created resources/main directory');

  let deployedPlugins = [];

  // Step 4: Copy all valid plugins to resources/main
  if (validPlugins.length > 0) {
    for (const plugin of validPlugins) {
      const pluginSourceDir = path.join(pluginsDir, plugin);
      const pluginDestDir = path.join(mainDir, plugin);

      console.log(`Copying plugin "${plugin}" to resources/main...`);
      copyDirectory(pluginSourceDir, pluginDestDir);
      deployedPlugins.push(plugin);
    }

    if (deployedPlugins.length > 0) {
      console.log(`${deployedPlugins.length} plugin(s) copied successfully`);

      // Update server.toml with the deployed plugins
      updateServerToml(deployedPlugins);
    } else {
      console.log('No plugins deployed');

      // Update server.toml to remove all plugins
      updateServerToml([]);
    }
  } else {
    console.log('No valid plugins found to deploy');

    // Update server.toml to remove all plugins
    updateServerToml([]);
  }

  // Set executable permissions if on Linux
  setExecutablePermissions();

  console.log('Development deployment completed successfully');
}

// Run the main function
main();
