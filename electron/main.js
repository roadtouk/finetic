const { app, BrowserWindow, ipcMain, shell } = require('electron');
const { join, resolve } = require('path');
const isDev = process.env.NODE_ENV === 'development';
const MPV = require('node-mpv');

let mainWindow;
let mpvPlayer;

// Enable live reload for Electron in development
if (isDev) {
  require('electron-reload')(__dirname, {
    electron: join(__dirname, '..', 'node_modules', '.bin', 'electron'),
    hardResetMethod: 'exit'
  });
}

async function createWindow() {
  console.log('Creating window...');
  
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: join(__dirname, '..', 'public', 'logo', 'desktop', 'finetic.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: join(__dirname, 'preload.js'),
      webSecurity: false, // Disable web security for development
    },
    titleBarStyle: 'hiddenInset',
    show: true, // Show immediately for debugging
    backgroundColor: '#ffffff', // Set a background color
  });
  
  console.log('Window created with dimensions:', mainWindow.getSize());

  // Initialize MPV player
try {
    console.log('Initializing MPV player...');
    
    // Check if MPV binary is available
    const { execSync } = require('child_process');
    try {
      const mpvVersion = execSync('mpv --version', { encoding: 'utf8' });
      console.log('MPV binary found:', mpvVersion.split('\n')[0]);
    } catch (mpvError) {
      console.warn('MPV binary not found in PATH:', mpvError.message);
    }
    
    // Initialize with explicit binary path and embedding options
    const mpvOptions = {
      debug: isDev,
      verbose: isDev,
      // Try to specify the binary path explicitly
      binary: '/opt/homebrew/bin/mpv', // Common Homebrew path on macOS
      // Options to try to embed MPV in the Electron window
      socket: '/tmp/mpv-socket', // Use IPC socket for better control
      time_update: 1, // Get time updates every second
    };
    
    console.log('MPV options:', mpvOptions);
    mpvPlayer = new MPV(mpvOptions);
    
    // Log the MPV player object methods for debugging
    console.log('MPV Player initialized. Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(mpvPlayer)));
    
    // The node-mpv library doesn't require explicit start() or connect() calls
    // The player is ready to use after construction
    console.log('MPV player initialized successfully');
  } catch (error) {
    console.error('Failed to initialize MPV player:', error.message);
    console.error('Full error:', error);
    
    // Try without explicit binary path
    try {
      console.log('Retrying MPV initialization without binary path...');
      mpvPlayer = new MPV({
        debug: isDev,
        verbose: isDev,
      });
      console.log('MPV player initialized successfully on retry');
    } catch (retryError) {
      console.error('Retry also failed:', retryError.message);
      // Set mpvPlayer to null so other parts of the code know it's not available
      mpvPlayer = null;
    }
  }

  // Always load from localhost for now (you'll need to run 'npm start' separately)
  try {
    console.log('Loading URL: http://localhost:3000');
    await mainWindow.loadURL('http://localhost:3000');
    console.log('URL loaded successfully');
  } catch (error) {
    console.error('Failed to load URL:', error);
    // Show error page
    mainWindow.loadURL(`data:text/html;charset=utf-8,
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
          <h1>Connection Error</h1>
          <p>Could not connect to http://localhost:3000</p>
          <p>Make sure your Next.js server is running with: <code>npm run dev</code></p>
          <p>Error: ${error.message}</p>
        </body>
      </html>
    `);
  }
  
  if (isDev) {
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  }
  
  // Add web contents event listeners for debugging
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Failed to load:', errorCode, errorDescription, validatedURL);
  });
  
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page finished loading');
  });
  
  mainWindow.webContents.on('dom-ready', () => {
    console.log('DOM is ready');
  });

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
    if (mpvPlayer) {
      mpvPlayer.quit();
    }
  });

  // Handle fullscreen changes
  mainWindow.on('enter-full-screen', () => {
    console.log('Main process: Entered fullscreen');
    mainWindow.webContents.send('fullscreen-changed', true);
  });

  mainWindow.on('leave-full-screen', () => {
    console.log('Main process: Left fullscreen');
    mainWindow.webContents.send('fullscreen-changed', false);
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// App event listeners
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', async () => {
  if (mpvPlayer) {
    try {
      await mpvPlayer.quit();
    } catch (error) {
      console.error('Error quitting MPV player:', error);
    }
  }
});

// IPC handlers for MPV controls
ipcMain.handle('mpv-load', async (event, url, options = {}) => {
  if (!mpvPlayer) {
    throw new Error('MPV player not initialized');
  }
  
  try {
    // For external MPV window (current behavior)
    await mpvPlayer.load(url, 'replace');
    
    // Set additional options if provided
    if (options.subtitles) {
      await mpvPlayer.addSubtitles(options.subtitles);
    }
    
    if (options.volume !== undefined) {
      await mpvPlayer.volume(options.volume);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error loading video in MPV:', error);
    throw error;
  }
});

// IPC handler to create an embedded MPV player
ipcMain.handle('mpv-load-embedded', async (event, url, options = {}) => {
  if (!mpvPlayer) {
    throw new Error('MPV player not initialized');
  }
  
  try {
    console.log('Loading video in embedded mode:', url);
    
    // Note: For true embedding, you would need to:
    // 1. Create a child window or use BrowserView
    // 2. Use MPV with --wid option to embed in that window
    // 3. This is more complex and requires platform-specific code
    
    // For now, we'll use the standard approach but with minimal window decorations
    await mpvPlayer.load(url, 'replace');
    
    // Try to minimize the MPV window decorations
    try {
      await mpvPlayer.setProperty('border', false);
      await mpvPlayer.setProperty('title-bar', false);
    } catch (propError) {
      console.warn('Could not set MPV window properties:', propError.message);
    }
    
    if (options.subtitles) {
      await mpvPlayer.addSubtitles(options.subtitles);
    }
    
    if (options.volume !== undefined) {
      await mpvPlayer.volume(options.volume);
    }
    
    return { success: true, embedded: false }; // embedded: false indicates external window
  } catch (error) {
    console.error('Error loading video in embedded MPV:', error);
    throw error;
  }
});

ipcMain.handle('mpv-play', async () => {
  if (!mpvPlayer) {
    throw new Error('MPV player not initialized');
  }
  
  try {
    await mpvPlayer.play();
    return { success: true };
  } catch (error) {
    console.error('Error playing video:', error);
    throw error;
  }
});

ipcMain.handle('mpv-pause', async () => {
  if (!mpvPlayer) {
    throw new Error('MPV player not initialized');
  }
  
  try {
    await mpvPlayer.pause();
    return { success: true };
  } catch (error) {
    console.error('Error pausing video:', error);
    throw error;
  }
});

ipcMain.handle('mpv-stop', async () => {
  if (!mpvPlayer) {
    throw new Error('MPV player not initialized');
  }
  
  try {
    await mpvPlayer.stop();
    return { success: true };
  } catch (error) {
    console.error('Error stopping video:', error);
    throw error;
  }
});

ipcMain.handle('mpv-seek', async (event, position) => {
  if (!mpvPlayer) {
    throw new Error('MPV player not initialized');
  }
  
  try {
    await mpvPlayer.seek(position);
    return { success: true };
  } catch (error) {
    console.error('Error seeking video:', error);
    throw error;
  }
});

ipcMain.handle('mpv-set-volume', async (event, volume) => {
  if (!mpvPlayer) {
    throw new Error('MPV player not initialized');
  }
  
  try {
    await mpvPlayer.volume(volume);
    return { success: true };
  } catch (error) {
    console.error('Error setting volume:', error);
    throw error;
  }
});

ipcMain.handle('mpv-get-position', async () => {
  if (!mpvPlayer) {
    throw new Error('MPV player not initialized');
  }
  
  try {
    const position = await mpvPlayer.getProperty('time-pos');
    const duration = await mpvPlayer.getProperty('duration');
    return { position, duration };
  } catch (error) {
    console.error('Error getting position:', error);
    throw error;
  }
});

ipcMain.handle('mpv-fullscreen', async (event, enable) => {
  if (!mpvPlayer) {
    throw new Error('MPV player not initialized');
  }
  
  try {
    await mpvPlayer.fullscreen(enable);
    return { success: true };
  } catch (error) {
    console.error('Error toggling fullscreen:', error);
    throw error;
  }
});

ipcMain.handle('mpv-add-subtitles', async (event, subtitlePath) => {
  if (!mpvPlayer) {
    throw new Error('MPV player not initialized');
  }
  
  try {
    await mpvPlayer.addSubtitles(subtitlePath);
    return { success: true };
  } catch (error) {
    console.error('Error adding subtitles:', error);
    throw error;
  }
});

// IPC handler to get current fullscreen state
ipcMain.handle('get-fullscreen-state', async () => {
  if (mainWindow) {
    const isFullscreen = mainWindow.isFullScreen();
    console.log('Current fullscreen state:', isFullscreen);
    return { isFullscreen };
  }
  return { isFullscreen: false };
});

// Handle app protocol for deep linking (optional)
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('finetic', process.execPath, [resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient('finetic');
}
