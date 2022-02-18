// imports **************************************************
const { ipcRenderer } = require('electron')
const path = require('path')
const fs = require('fs');

// Filesystem watch for changes
const chokidar = require('chokidar');

// .zmok file parser
const toml = require('toml');

// PNG render library
const sharp = require('sharp');

const PSD = require('psd');
const THREE = require("three");
require('./GLTFLoader');
const { render_scene } = require('./render');
const { parseTOML } = require('./parseTOML');
//***********************************************************

const windowTitle = 'ZMOK';

// To get latest render time
const today = new Date();

let render_quality = 1;

let watcher_textures;

// watches .PSD textures for changes
function set_watcher_textures(data) {
  //console.log(data);
  return chokidar.watch(data.textures_to_watch, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    usePolling: true,
  })
    .on('change', psd_texture_path => {
      //console.log(psd_texture_path);
      const psd_texture_file = path.basename(psd_texture_path);
      const renderData = data.textures.find(element => element.texture.includes(psd_texture_file));
      // add quality attribute to renderData
      renderData.quality = render_quality;
      //console.log(renderData);
      render_scene(renderData);
    })
}

// add listener to the render-quality checkbox
window.addEventListener('DOMContentLoaded', (event) => {

  document.getElementById('render-quality')
    .addEventListener('change', (event) => {
      if (event.currentTarget.checked) {
        render_quality = 1.5;
      } else {
        render_quality = 1;
      }
    })
});



function change_text(element, text) {
  document.getElementById(element).innerHTML = text;
}

function status_update(text) {
  change_text('render-info-status-text', text)
}

function latest_render_update(mockup_name) {
  // to display double digits in minutes (09 instead of 9)
  mins = ('0' + today.getMinutes()).slice(-2);
  time = today.getHours() + ":" + mins;
  change_text('render-info-mockup-text', mockup_name)
  change_text('render-info-time-text', time)
}

function reset_ui() {
  change_text('render-info-mockup-text', '-')
  change_text('render-info-time-text', '-')
  status_update('Ready<br>Waiting for edits in Photoshop')
  if (document.getElementsByTagName('canvas')[0]) {
    document.getElementsByTagName('canvas')[0].remove()
  }
}

function load_set() {
  ipcRenderer.send('open-mockup-set-dialog')
  //  window.electron.open_mockup_set()
}

function app_window_control(command) {
  ipcRenderer.send('app', command)
}

function refresh_spawn() {
  ipcRenderer.send('refresh-spawn')
}


function core_display(bool) {
  //console.log(bool);
  if (bool) {
    document.getElementById("app-core").style.display = "flex";
    document.getElementById("mockup-set-info").style.display = "flex";
  }
  else {
    document.getElementById("app-core").style.display = "none";
    document.getElementById("mockup-set-info").style.display = "none";
  }
}

function error_display(bool, filepath, text) {
  if (bool) {
    document.getElementById("error-core-text").innerHTML = text;
    document.getElementById("error-core-file").innerHTML = "on → " + filepath;
    document.getElementById("error-core-container").style.display = "flex";
  }
  else {
    document.getElementById("error-core-container").style.display = "none";
  }
}


ipcRenderer.on('open-mockup-set', (event, file) => {
  parseTOML(file)
    .then((data) => {
      error_display(false);
      if (watcher_textures) {
        watcher_textures.close().then(() => {
          watcher_textures = set_watcher_textures(data);
        })
      } else {
        watcher_textures = set_watcher_textures(data);
      }
      reset_ui();
      core_display(true);
      document.title = `${windowTitle} - ${data.name}`;

      // render_scene(0, 0, 0);
    })
    .catch(function (reject) {
      const filepath = path.resolve(file.dir, file.base);
      core_display(false);
      error_display(true, filepath, reject)
      document.title = windowTitle;
    })
})
