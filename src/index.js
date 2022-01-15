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

// Variables for every watcher function because they
// have to be updated when mockup-set is changed.
let watcher_textures;
// let watcher_renders;

// watches .PSD textures for changes
function set_watcher_textures(data) {
  console.log(data);
  return chokidar.watch(data.textures_to_watch, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    usePolling: true,
  })
    .on('change', psd_texture_path => {
      console.log(psd_texture_path);
      const psd_texture_file = path.basename(psd_texture_path);
      const renderData = data.textures.find(element => element.texture.includes(psd_texture_file));
      renderData.quality = 1;
      render_scene(renderData);
    })
}

// watches for rendered .PNG files for changes and calls for
// refresh_spawn(), which is a dirty hack that spawns an invisible 
// window for a couple of miliseconds once the render has been saved.
// calling it here and not right after the library sharp
// has finished processing the png because there's some delay
// by the OS to report a proper updated file to Photoshop.

// UPDATE: not really used because it still needs to wait a sec to get
// a proper update in Photoshop. Don't know why. Maybe Photoshop?
// Better to use this directly after sharp processed the .PNG at the end
// of the render.js pipeline. The less watchers the better.
function set_watcher_renders(data) {
  return chokidar.watch(data.renders_to_watch, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    usePolling: true,
  })
    .on('change', () => {
      setTimeout(function () {
        refresh_spawn()
      }, 1000)
    });
}



function change_text(element, text) {
  document.getElementById(element).innerHTML = text;
}

function status_update(text) {
  change_text('render-info-status-text', text)
}

function latest_render_update(mockup_name) {
  time = today.getHours() + ":" + today.getMinutes();
  change_text('render-info-mockup-text', mockup_name)
  change_text('render-info-time-text', time)
}

function load_set() {
  ipcRenderer.send('open-mockup-set')
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
    document.getElementById("error-core").style.display = "flex";
  }
  else {
    document.getElementById("error-core").style.display = "none";
  }
}


ipcRenderer.on('open-mockup-set', (event, file) => {
  parseTOML(file)
    .then((data) => {
      error_display(false);
      watcher_textures = set_watcher_textures(data);
      // watcher_renders = set_watcher_renders(data);
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
