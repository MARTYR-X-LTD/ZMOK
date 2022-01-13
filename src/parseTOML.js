// Generate black .png files if render files
// are missing. Useful to recreate those when
// developing mockups.
function generate_black_png(filepath, width, height) {
   sharp({
      create: {
         width: width,
         height: height,
         channels: 4,
         background: { r: 0, g: 0, b: 0, alpha: 1 }
      }
   })
      .png({ compressionLevel: 9 })
      .toFile(filepath);
}


function parseTOML(file) {

   const filepath = path.resolve(file.dir, file.base);
   const data_dir = path.join(file.dir, 'data-zmok')

   if (!fs.existsSync(data_dir)) {
      return Promise.reject(`
       ⛔ The folder data-zmok is missing.
       <br>
       📦 Unzip all the files from the mockup pack and try again. 
       <br>
       📄 Follow the included installation steps from the mockup pack for more information.`
      )
   }

   var fileContents = fs.readFileSync(filepath, 'utf8');
   let data = toml.parse(fileContents);

   // add data_dir folder to the data
   data.data_dir = data_dir;

   // Set is a cool ES6 property that can create array
   // with unique objects on it. It checks for repeated objects
   // as they are added.
   const mockups = new Set();
   const textures = new Set();
   const missing_files = new Set();

   for (const e of data.textures) {
      // populate mockups names to know the amount. Nothing more.
      mockups.add(e.mockup_name);

      // populate textures to know the amount and verify if there's a missing file.
      // also, this will feed the watcher for changes in files
      const texture_path = path.join(data_dir, e.texture);
      fs.existsSync(texture_path) ? textures.add(texture_path) : missing_files.add(e.texture);
      e.texture = texture_path;

      // populate render_output to verify if there's a missing file.
      // generate a black png if a file is missing. 
      // First resolution value is width. Second is height.
      e.render_output = path.join(data_dir, e.render_output);
      const render_r_width = e.render_resolution[0];
      const render_r_height = e.render_resolution[1];
      if (!fs.existsSync(e.render_output)) {
         generate_black_png(e.render_output, render_r_width, render_r_height);
      }
      e.render_r_width = render_r_width;
      e.render_r_height = render_r_height;


      // populate scene 3d files to verify if there's a missing file.
      const scene_path = path.join(data_dir, e.scene);
      if (!fs.existsSync(scene_path)) missing_files.add(e.scene);
      e.scene = scene_path;
   }

   // verify missing files. Return error if there's any.
   if (missing_files.size > 0) {
      var missing_files_text = [...missing_files].join('<br>');

      return Promise.reject(
         `⛔ Some files on the data-zmok folder are missing.
       <br>
       📦 Unzip all the files from the mockup pack and try again. 
       <br>
       📄 Follow the included installation steps from the mockup pack for more information.
       <br>
       <br>
       Missing files:<br>
       <code>${missing_files_text}</code>`
      )
   }

   // add array of textures to watch for changes in watcher
   data.files_to_watch = [...textures];

   var number_mockups = mockups.size
   var number_textures = textures.size
   var number_mockups_text = `${number_mockups} mockup${number_mockups === 1 ? "" : "s"} and ${number_textures} texture${number_textures === 1 ? "" : "s"}`;

   change_text('mockup-set-number', number_mockups_text)
   change_text('mockup-set-name-text', data.name)

   return Promise.resolve(data);
}

exports.parseTOML = parseTOML;