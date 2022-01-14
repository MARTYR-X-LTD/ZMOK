const { contextBridge, ipcRenderer } = require('electron')
//console.log(ipcRenderer.sendSync('synchronous-message', 'ping')) // prints "pong"


ipcRenderer.on('open-mockup-set', (event, success) => {
  if (success === true) {
    core_display(true)
  }
})

function core_display(bool){
  console.log(bool);
  if (bool) {
    document.getElementById("app-core").style.display = "flex";
  }
  else {
    document.getElementById("app-core").style.display = "none";
    
  }
}

function load_sett(){
  ipcRenderer.send('open-mockup-set')
}

function ipc_receiver(context, command){
  ipcRenderer.send(context, command)
}

contextBridge.exposeInMainWorld(
  'electron',
  {
      open_mockup_set: () => load_sett(),
      app_window_control: (command) => ipc_receiver('app', command),
  }
)