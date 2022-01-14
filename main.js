const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const path = require('path')
const chokidar = require('chokidar');
const concat = require('concat-stream');
const fs = require('fs');
const toml = require('toml');

let win;
let child;

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

function createChildren() {
  child = new BrowserWindow({
    width: 800,
    height: 1,
    transparent: true,
    alwaysOnTop: true,
    frame: false,
    autoHideMenuBar: true,
    //visibleOnAllWorkspaces:true, 
  });
  child.loadFile('src/invisible.html');
  child.setIgnoreMouseEvents(true);

  child.on('closed', () => {
    child = null
  })

  //child.minimize();
  child.hide();
  if (process.platform == "darwin") child.app.hide();

  child.show();
  child.restore();

  setTimeout(function () { child.close() }, 100)

}


app.whenReady().then(() => {
  createWindow()

  win.once('ready-to-show', () => {
    win.show()
  })
  //setTimeout(createChildren, 10000) 

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
  let file;
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
          //parseTOML(path.resolve(file.dir, file.base));
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
  createChildren();
})


ipcMain.on('synchronous-message', (event, arg) => {
  console.log(arg) // prints "ping"
  event.returnValue = 'pong'
})


/* pluralize
const number = 2;
const string = `${number} trutle${number === 1 ? "" : "s"}`; //this one
console.log(string)
*/