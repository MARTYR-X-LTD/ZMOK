const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const path = require('path')
const child_process = require('child_process')

let win;

if (app.isPackaged) {
  // workaround for missing executable argument)
  process.argv.unshift(null)
}
// parameters is now an array containing any files/folders that your OS will pass to your application
let external_file = process.argv[2];


function open_mockup_init(external_file) {
  external_file = path.parse(path.resolve(external_file));
  console.log(external_file);
  if (external_file.ext === '.zmok') {
    win.webContents.send('open-mockup-set', external_file);
  } else {
    dialog.showMessageBoxSync(win, {
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

function createWindow() {
  win = new BrowserWindow({
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

  //open links in external browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  //win.setMenu(null)
  win.loadFile('src/index.html');


}

function update_smart_objects() { 
  if (process.platform == "win32") {
    spawn = child_process.spawnSync;
    spawn('cscript.exe', [path.join(resourcePath, 'photoshop_scripts/update_smart_objects.vbs')]);
  } else if (process.platform == 'darwin') {
    var cmd = 'osascript ' + path.join(resourcePath, 'photoshop_scripts/update_smart_objects.scpt');
    child_process.exec(cmd);
  }
}


app.whenReady().then(() => {
  createWindow();

  win.once('ready-to-show', () => {
    win.show();
  })

  win.webContents.on('dom-ready', () => {
    if (external_file) {
      open_mockup_init(external_file);
    }
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  //if (process.platform !== 'darwin') {
  //  app.quit()
  //}
  app.quit()
})

ipcMain.on('open-mockup-set', (event, arg) => {
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
          dialog.showMessageBoxSync(win, {
            title: 'Error',
            message: 'Invalid file',
            type: 'error'
          })
        }
      }
    }).catch(err => {
      dialog.showMessageBoxSync(win, {
        title: 'Error',
        message: err,
        type: 'error'
      })
    })


})

ipcMain.on('app', (event, arg) => {
  switch (arg) {
    case 'minimize':
      win.minimize();
      break;
    case 'quit':
      app.quit();
      break;
  }
})


ipcMain.on('refresh-spawn', (event, arg) => {
  update_smart_objects();
})


ipcMain.on('synchronous-message', (event, arg) => {
  console.log(arg) // prints "ping"
  event.returnValue = 'pong'
})
