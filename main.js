const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const path = require('path')
const child_process = require('child_process')

let windows = new Set();
let currenwWindow = null;
//let window = null;
let external_file;

const gotTheLock = app.requestSingleInstanceLock();

if (app.isPackaged) {
  // workaround for missing executable argument
  process.argv.unshift(null)
}
// parameters is now an array containing any files/folders that your OS will pass to your application
// this is used by Windows Explorer to open files with double click.
// macOS uses open-file
if (process.argv[2]) {
  external_file = process.argv[2];
}

app.on('open-file', (event, path) => {
  // exclusive call for macOS. Windows use the external_file stuff directly from process.argv[2].
  if (windows.size > 0) {
    createWindow();
  }
  // calling to window somehow works, like a messagebox

  external_file = path;

  //open_mockup_init(path);
  // here i need to add open_mockup_init
  // or open a new window when called
  // but beware of not loading
  // 2 windows from 0 widnows loaded
  // with second-instance


  // prevent default is necessary for open-file to work. 
  // It says in the docs. Why? Who knows.
  // https://www.electronjs.org/docs/latest/api/app
  event.preventDefault();
});


function open_mockup_init(external_file, window) {
  external_file_parsed = path.parse(path.resolve(external_file));
  currentWindow = window;
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

const createWindow = () => {
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

  windows.add(window);


  //open links in external browser
  window.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  //win.setMenu(null)
  window.loadFile('src/index.html');

  window.once('ready-to-show', () => {
    window.show();   
    console.log(window);
  

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

    // here, move it here!
    if (external_file) {
      open_mockup_init(external_file, window);
    }
  })
}

ipcMain.on('app', (event, arg) => {
  currentWindow = BrowserWindow.getFocusedWindow();
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
    var cmd = 'cscript.exe ' + path.join(resourcePath, 'photoshop_scripts/update_smart_objects.vbs');
  } else if (process.platform == 'darwin') {
    var cmd = 'osascript ' + path.join(resourcePath, 'photoshop_scripts/update_smart_objects.scpt');
  }
  child_process.exec(cmd);
}


app.whenReady().then(() => {
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  })
})

app.on('second-instance', (event, commandLine, workingDirectory) => {
  // Someone tried to run a second instance, we should focus our window.
  // XD??????????? not used, broooooo
  createWindow();
})

app.on('window-all-closed', () => {
  //if (process.platform !== 'darwin') {
  //  app.quit()
  //}
  app.quit()
})

ipcMain.on('open-mockup-set-dialog', (event, arg) => {
  dialog.showOpenDialog({
    title: 'Open Mockup Set',
    filters: [{ name: 'ZMOK 3D Mockup Set', extensions: ['zmok'] }],
    properties: ['openFile']
  })
    .then(result => {
      if (result.canceled === false) {
        let file = path.parse(result.filePaths[0])
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
          dialog.showMessageBoxSync(window, {
            title: 'Error',
            message: 'Invalid file',
            type: 'error'
          })
        }
      }
    }).catch(err => {
      dialog.showMessageBoxSync(window, {
        title: 'Error',
        message: err,
        type: 'error'
      })
    })


})


ipcMain.on('refresh-spawn', (event, arg) => {
  update_smart_objects();
})


ipcMain.on('synchronous-message', (event, arg) => {
  console.log(arg) // prints "ping"
  event.returnValue = 'pong'
})
