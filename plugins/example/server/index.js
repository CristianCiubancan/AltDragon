import * as alt from 'alt-server';

// Resource initialization
alt.log('Example resource starting...');

// Player connect event
alt.on('playerConnect', handlePlayerConnect);

// Player disconnect event
alt.on('playerDisconnect', handlePlayerDisconnect);

// Handle player connection
function handlePlayerConnect(player) {
  alt.log(`Player connected: ${player.name}`);
  
  // Spawn positions - variety of nice locations
  const spawnPositions = [
    { x: -1042.4601, y: -2745.4338, z: 21.3594 },   // Airport
    { x: 80.4588, y: -1966.2541, z: 21.0369 },      // Grove Street
    { x: -74.9482, y: -818.4858, z: 326.1745 },     // Maze Bank Tower top
    { x: -1377.6260, y: -2848.8601, z: 13.9455 },   // Beach
    { x: 190.5618, y: -934.0596, z: 30.6866 }       // Legion Square
  ];
  
  // Choose a random spawn position
  const spawnPos = spawnPositions[Math.floor(Math.random() * spawnPositions.length)];
  
  // Spawn the player
  try {
    // Set player model
    player.model = 'mp_m_freemode_01';  // Default male character
    
    // Set player position with a small delay to ensure model is loaded
    alt.setTimeout(() => {
      try {
        // Set position and spawn
        player.spawn(spawnPos.x, spawnPos.y, spawnPos.z, 0);
        
        // Ensure player is fully spawned before giving weapons
        alt.setTimeout(() => {
          // Example of giving the player some basic weapons
          alt.emitClient(player, 'example:giveWeapons');
          
          player.sendNotification(`Welcome to the server, ${player.name}! Press F2 or type /ui to toggle the UI`);
          alt.log(`Player ${player.name} spawned at ${spawnPos.x}, ${spawnPos.y}, ${spawnPos.z}`);
        }, 1000);
      } catch (error) {
        alt.logError(`Failed to spawn player ${player.name}: ${error.message}`);
      }
    }, 500);
  } catch (error) {
    alt.logError(`Failed to set up player ${player.name}: ${error.message}`);
  }
}

// Handle player disconnection
function handlePlayerDisconnect(player, reason) {
  alt.log(`Player disconnected: ${player.name}, Reason: ${reason}`);
}

// Register chat commands
alt.on('chat:message', (player, message) => {
  // UI toggle command
  if (message.startsWith('/ui')) {
    toggleUI(player);
    return;
  }
  
  // Vehicle spawn command
  if (message.startsWith('/vehicle') || message.startsWith('/veh')) {
    const args = message.split(' ');
    let vehicleName = 'adder'; // Default vehicle
    
    if (args.length >= 2) {
      vehicleName = args[1].toLowerCase();
    }
    
    spawnVehicle(player, vehicleName);
    return;
  }
  
  // Teleport command
  if (message.startsWith('/tp')) {
    const args = message.split(' ');
    let x = 0, y = 0, z = 0;
    
    if (args.length >= 4) {
      x = parseFloat(args[1]);
      y = parseFloat(args[2]);
      z = parseFloat(args[3]);
      
      if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
        teleportPlayer(player, x, y, z);
        return;
      }
    }
    
    player.sendNotification('Usage: /tp x y z');
    return;
  }
});

// Toggle UI function
function toggleUI(player) {
  try {
    alt.emitClient(player, 'example:showUI');
    alt.log(`Sent UI toggle to ${player.name}`);
  } catch (error) {
    alt.logError(`Failed to toggle UI for ${player.name}: ${error.message}`);
  }
}

// Helper function to send notifications to players
alt.Player.prototype.sendNotification = function(message) {
  try {
    alt.emitClient(this, 'example:notification', message);
  } catch (error) {
    alt.logError(`Failed to send notification: ${error.message}`);
  }
};

// Function to spawn a vehicle for a player
function spawnVehicle(player, vehicleName) {
  try {
    // Get player position and rotation
    const pos = player.pos;
    const rot = player.rot;
    
    // Spawn vehicle 2 meters in front of the player
    const forwardVector = {
      x: Math.sin(-rot.z * Math.PI / 180) * 4,
      y: Math.cos(-rot.z * Math.PI / 180) * 4,
      z: 0
    };
    
    const spawnPos = {
      x: pos.x + forwardVector.x,
      y: pos.y + forwardVector.y,
      z: pos.z
    };
    
    // Create the vehicle
    const vehicle = new alt.Vehicle(vehicleName, spawnPos.x, spawnPos.y, spawnPos.z, 0, 0, rot.z);
    
    // Check if vehicle was created successfully
    if (vehicle) {
      alt.log(`Spawned vehicle ${vehicleName} for player ${player.name}`);
      player.sendNotification(`Vehicle ${vehicleName} spawned!`);
      
      // Set engine on and customize the vehicle
      vehicle.engineOn = true;
      vehicle.numberPlateText = 'ALTV';
      vehicle.primaryColor = Math.floor(Math.random() * 159);
      vehicle.secondaryColor = Math.floor(Math.random() * 159);
    } else {
      player.sendNotification(`Failed to spawn vehicle: ${vehicleName}`);
    }
  } catch (error) {
    alt.logError(`Error spawning vehicle: ${error.message}`);
    player.sendNotification(`Failed to spawn vehicle: ${error.message}`);
  }
}

// Function to teleport a player to coordinates
function teleportPlayer(player, x, y, z) {
  try {
    // Teleport the player
    player.pos = { x, y, z };
    alt.log(`Teleported player ${player.name} to ${x}, ${y}, ${z}`);
    player.sendNotification(`Teleported to ${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)}`);
  } catch (error) {
    alt.logError(`Error teleporting player: ${error.message}`);
    player.sendNotification(`Failed to teleport: ${error.message}`);
  }
}

// Register console commands for admins
// Example: "veh adder PlayerName" to spawn a vehicle for a specific player
alt.on('consoleCommand', (command, ...args) => {
  const cmd = command.toLowerCase();
  
  // Vehicle spawn command from console
  if (cmd === 'veh' || cmd === 'vehicle') {
    if (args.length < 2) {
      alt.log('Usage: veh <vehicleName> <playerName>');
      return;
    }
    
    const vehicleName = args[0].toLowerCase();
    const playerName = args[1];
    
    // Find the player
    const player = alt.Player.all.find(p => p.name.toLowerCase() === playerName.toLowerCase());
    
    if (player) {
      spawnVehicle(player, vehicleName);
      alt.log(`Spawned ${vehicleName} for ${player.name}`);
    } else {
      alt.log(`Player ${playerName} not found`);
    }
  }
});

// Server startup complete
alt.log('Example resource started successfully with gameplay features!');