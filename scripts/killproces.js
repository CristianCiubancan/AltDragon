const { exec } = require('child_process');
const os = require('os');

function killProcessWindows(processName, callback) {
  // Use taskkill to kill process by name
  exec(`taskkill /F /IM ${processName}`, (error, stdout, stderr) => {
    if (error) {
      if (stderr.includes('not found')) {
        console.log(`${processName} not running.`);
        callback(null);
      } else {
        callback(error);
      }
      return;
    }
    console.log(`Killed ${processName} on Windows.`);
    callback(null);
  });
}

function killNodeScriptWindows(scriptPath, callback) {
  // Find node processes running the script and kill them
  exec(
    `wmic process where "CommandLine like '%${scriptPath}%'" get ProcessId`,
    (error, stdout, stderr) => {
      if (error) {
        callback(error);
        return;
      }
      const pids = stdout
        .split('\n')
        .slice(1)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
      if (pids.length === 0) {
        console.log(
          `No node processes running ${scriptPath} found on Windows.`
        );
        callback(null);
        return;
      }
      let killedCount = 0;
      pids.forEach((pid) => {
        exec(`taskkill /F /PID ${pid}`, (err) => {
          if (err) {
            // Check if the error is because the process was not found
            if (err.message && err.message.includes('not found')) {
              console.log(
                `Process with PID ${pid} was not found (already terminated?).`
              );
            } else {
              console.error(`Failed to kill PID ${pid}:`, err);
            }
          } else {
            console.log(
              `Killed node process PID ${pid} running ${scriptPath} on Windows.`
            );
          }
          killedCount++;
          if (killedCount === pids.length) {
            callback(null);
          }
        });
      });
    }
  );
}

function killProcessLinux(processName, callback) {
  // Use pkill to kill process by name
  exec(`pkill -f ${processName}`, (error, stdout, stderr) => {
    if (error) {
      if (error.code === 1) {
        // no process found
        console.log(`${processName} not running.`);
        callback(null);
      } else {
        callback(error);
      }
      return;
    }
    console.log(`Killed ${processName} on Linux.`);
    callback(null);
  });
}

function killNodeScriptLinux(scriptPath, callback) {
  // Use pkill to kill node processes running the script
  exec(`pkill -f "node.*${scriptPath}"`, (error, stdout, stderr) => {
    if (error) {
      if (error.code === 1) {
        // no process found
        console.log(`No node processes running ${scriptPath} found on Linux.`);
        callback(null);
      } else {
        callback(error);
      }
      return;
    }
    console.log(`Killed node processes running ${scriptPath} on Linux.`);
    callback(null);
  });
}

function main() {
  const platform = os.platform();
  const scriptPath = 'scripts/dev.js';
  if (platform === 'win32') {
    // Kill altv-server.exe and node scripts/dev.js
    killProcessWindows('altv-server.exe', (err) => {
      if (err) {
        console.error('Error killing altv-server.exe:', err);
      }
      killNodeScriptWindows(scriptPath, (err2) => {
        if (err2) {
          console.error('Error killing node scripts/dev.js:', err2);
        }
      });
    });
  } else if (platform === 'linux') {
    // Kill altv-server and node scripts/dev.js
    killProcessLinux('altv-server', (err) => {
      if (err) {
        console.error('Error killing altv-server:', err);
      }
      killNodeScriptLinux(scriptPath, (err2) => {
        if (err2) {
          console.error('Error killing node scripts/dev.js:', err2);
        }
      });
    });
  } else {
    console.log(
      `Unsupported platform: ${platform}. This script supports only Windows and Linux.`
    );
  }
}

main();
