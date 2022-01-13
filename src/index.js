// imports **************************************************
const { ipcRenderer } = require('electron')
const path = require('path')
const fs = require('fs');

// Filesystem watch for changes
const chokidar = require('chokidar');

// .bm3d file parser
const toml = require('toml');

// PNG render library
const sharp = require('sharp');

const PSD = require('psd');
const THREE = require("three");
require('three/examples/js/loaders/GLTFLoader');
const { render_scene } = require('./render');
const { parseTOML } = require('./parseTOML');
//***********************************************************

const windowTitle = 'ZMOK';

// To get latest render time
const today = new Date();

// watches for file changes in data-bm3d. Set by set_watcher(datadir)
let watcher;

function set_watcher(data) {
  console.log(data);
  // return chokidar.watch(data.files_to_watch, {

  return chokidar.watch(data.data_dir, {
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
      watcher = set_watcher(data);
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
