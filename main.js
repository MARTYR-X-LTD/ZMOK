const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const path = require('path')
const child_process = require('child_process')

let windows = new Set();
let initial_file_macOS = null;

const gotTheLock = app.requestSingleInstanceLock();

if (app.isPackaged) {
  // workaround for missing executable argument
  process.argv.unshift(null)
}

app.on('open-file', (event, path) => {
  // prevent trying to create 2 windows when ZMOK is not running at all
  // and a file has been open from Finder.
  // Else, it will fill a variable which is going to be used
  // when the application has finished loading (initial_file_macOS).
  // Otherwise, calling createWindow before the app has finished
  // loading, will result in error. 
  if (windows.size > 0) {
    // path = path to opening document from Finder
    createWindow(path);
  } else {
    initial_file_macOS = path;
  }

  // prevent default is necessary for open-file to work. 
  // It says in the docs. Why? Who knows.
  // https://www.electronjs.org/docs/latest/api/app
  event.preventDefault();
});


function open_mockup_init(external_file, currentWindow) {
  external_file_parsed = path.parse(path.resolve(external_file));
  //currentWindow = BrowserWindow.getFocusedWindow();
  //console.log(external_file);
  if (external_file_parsed.ext === '.zmok') {
    currentWindow.webContents.send('open-mockup-set', external_file_parsed);
  } else {
    dialog.showMessageBoxSync(currentWindow, {
      title: 'Error',
      message: 'Invalid file',
      type: 'error'
    })
  }
}


app.commandLine.appendSwitch('lang', 'en-US');

const resourcePath =
  process.env.NODE_ENV === "dev"
    ? __dirname // Dev Mode
    : process.resourcesPath; // Live Mode

const createWindow = (external_file) => {
  let window = new BrowserWindow({
    width: 920 * 0.9,
    height: 540 * 0.9,
    autoHideMenuBar: true,
    frame: false,
    show: false,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
      //preload: path.join(__dirname, 'preload.js'),
      contextIsolation: false
    },
  })

  windows.add(window)

  //open links in external browser
  window.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  //win.setMenu(null)
  window.loadFile(path.join(__dirname, 'src/index.html'));
  
  window.once('ready-to-show', () => {
    window.show();
    //console.log(window);

    if (process.platform == 'darwin') {
      const { getAuthStatus, askForFullDiskAccess } = require('node-mac-permissions');

      if (getAuthStatus('full-disk-access') !== 'authorized') {
        dialog.showMessageBoxSync(window, {
          title: 'Full Disk Access',
          message: 'ZMOK requires Full Disk Access permission to be enabled in order to work properly.',
          type: 'info'
        });

        askForFullDiskAccess();
      }

    }
  })
  window.webContents.on('dom-ready', () => {
    //console.log(BrowserWindow.getAllWindows());

    if (external_file) {
      open_mockup_init(external_file, window);
    }

  })
}

ipcMain.on('app', (event, arg) => {
  let currentWindow = BrowserWindow.getFocusedWindow();
  switch (arg) {
    case 'minimize':
      currentWindow.minimize();
      break;
    case 'quit':
      currentWindow.close();
      windows.delete(currentWindow);
      //currentWindow = null;
      break;
  }
})


function update_smart_objects() {
  if (process.platform == "win32") {
    var cmd = 'cscript.exe /T:2 ' + path.join(resourcePath, 'photoshop_scripts/update_smart_objects.vbs');
  } else if (process.platform == 'darwin') {
    var cmd = 'osascript ' + path.join(resourcePath, 'photoshop_scripts/update_smart_objects.scpt');
  }
  child_process.exec(cmd);
}


app.whenReady().then(() => {
  
  (initial_file_macOS) ? createWindow(initial_file_macOS) : createWindow(process.argv[2]);

  app.on('activate', () => {
    // dont know the difference between this call and windows.size
    // but that's how's in the wiki.
    // 
    if (BrowserWindow.getAllWindows().length === 0) {
      (initial_file_macOS) ? createWindow(initial_file_macOS) : createWindow(process.argv[2]);
    }
  })
})

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (event, commandLine) => {
    // second-instance is NOT used by macOS when opening documents from Finder.
    // it is used when opening apps from the command line though.
    // all this if else logic is necessary to prevent duplicated processes
    // and execute everything in the main process

    // this is used by Windows Explorer to open files with double click.
    // macOS uses open-file
    // process.argv[2] = commandLine[2] = document being opened
    // if process.argv[2] is empty, it will return null automatically
    createWindow(commandLine[2]);
  })
}

app.on('window-all-closed', () => {
  //if (process.platform !== 'darwin') {
  //  app.quit()
  //}
  app.quit()
})

ipcMain.on('open-mockup-set-dialog', (event, arg) => {
  let currentWindow = BrowserWindow.getFocusedWindow();
  let result_open = dialog.showOpenDialogSync({
    title: 'Open Mockup Set',
    filters: [{ name: 'ZMOK 3D Mockup Set', extensions: ['zmok'] }],
    properties: ['openFile']
  })

  if (result_open) {
    let file = path.parse(result_open[0])
    // file returns:
    // { root: '/',
    //   dir: '/home/user/dir',
    //   base: 'file.txt',
    //   ext: '.txt',
    //   name: 'file' }
    if (file.ext === '.zmok') {
      // parseTOML(path.resolve(file.dir, file.base));
      event.reply('open-mockup-set', file);
    } else {
      dialog.showMessageBoxSync(currentWindow, {
        title: 'Error',
        message: 'Invalid file',
        type: 'error'
      })
    }
  }
})


ipcMain.on('refresh-spawn', (event, arg) => {
  update_smart_objects();
})

ipcMain.on('new-window', (event, arg) => {
  createWindow(null);
})

ipcMain.on('synchronous-message', (event, arg) => {
  console.log(arg) // prints "ping"
  event.returnValue = 'pong'
})
