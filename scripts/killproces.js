const { exec } = require('child_process');
const os = require('os');

function main() {
  const platform = os.platform();

  if (platform === 'win32') {
    killWindowsProcess();
  } else if (platform === 'linux') {
    killLinuxProcess();
  } else {
    console.log(
      `Unsupported platform: ${platform}. This script supports only Windows and Linux.`
    );
    process.exit(0);
  }
}

function killWindowsProcess() {
  console.log('Attempting to kill altv-server.exe...');
  exec('taskkill /F /IM altv-server.exe', (error) => {
    if (error) {
      console.log('altv-server.exe not running.');
    } else {
      console.log('Killed altv-server.exe');
    }
    console.log('Kill process completed');
    process.exit(0); // Explicitly exit with success code
  });
}

function killLinuxProcess() {
  console.log('Attempting to kill altv-server...');
  exec('pkill -f altv-server || true', (error) => {
    if (error) {
      console.log('altv-server not running.');
    } else {
      console.log('Killed altv-server');
    }
    console.log('Kill process completed');
    process.exit(0); // Explicitly exit with success code
  });
}

main();
