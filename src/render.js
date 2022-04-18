function PSDTexture(file) {
   return new Promise(function (resolve) {
      PSD.open(file).then((parsed) => {
         let psd = {
            uint8: parsed.image.touint8(),
            width: parsed.header.cols,
            height: parsed.header.rows,
         }
         resolve(new THREE.DataTexture(psd.uint8, psd.width, psd.height, THREE.RGBAFormat));
      })
   })
}

const render_scene = (renderData) => {

   /*
   renderData = {
      mockup_name: "Scene 1 - Bag 1.psd",
      render_output: "path to\\data-zmok\\scene-1_bag-1.png",
      render_r_height: 2400,
      render_r_width: 3840,
      render_resolution: [3840, 2400],
      scene: "path to\\data-zmok\\scene-1_bag-1.glb",
      texture: "path to\\data-zmok\\\scene-1_bag-1.psd",
      quality: 1,
   }
   */

   status_update(`Rendering...<br>File: <strong>${renderData.mockup_name}</strong>`)

   start = performance.now()
   console.log('started render_all')
   let texture = PSDTexture(renderData.texture);

   const width_render = renderData.render_r_width;
   const height_render = renderData.render_r_height;

   const renderer = new THREE.WebGLRenderer({
      preserveDrawingBuffer: true,
      alpha: true,
      antialias: true
   });

   // transparent background for proper PNG generation
   renderer.setClearColor(0x000000, 0);


   let model;
   let camera;

   let scene_loader = new THREE.GLTFLoader();
   let scene_renderer;

   scene_loader.load(renderData.scene, (collada) => {

      scene_renderer = collada.scene;

      camera = collada.cameras[0];

      for (const children of collada.scene.children) {
         if (children.type == 'Mesh') {
            model = children;
            break;
         }
      }

      if (!model) {
         console.error('ERROR: missing the camera in the GLB file!');
         return;
      }

      if (!camera) {
         console.error('ERROR: missing the model in the GLB file!');
         return;
      }

      const material = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.FrontSide });
      //const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
      model.material = material

      camera.aspect = width_render / height_render;

      camera.lookAt(scene_renderer.position);

      model.updateMatrix();
      model.geometry.applyMatrix4(model.matrix);

      camera.updateProjectionMatrix();
      renderer.setPixelRatio(1);
      texture.then((texture) => {

         texture.needsUpdate = true;

         model.material.map = texture;

         // smooth texture rendering
         model.material.map.anisotropy = renderer.capabilities.getMaxAnisotropy();


         model.material.map.generateMipmaps = false;

         // premultiply alpha works better on black/black surfaces,
         // but is really awful on clear/white surfaces combinations.
         // better be disabled.
         model.material.map.premultiplyAlpha = false;

         // lot of random stuff that will help prevent white/black borders around
         // transparent renders
         model.material.blending = THREE.CustomBlending;
         model.material.blendEquation = THREE.AddEquation;
         model.material.blendSrc = THREE.OneFactor;
         model.material.blendDst = THREE.OneMinusSrcAlphaFactor;
         model.material.blendSrcAlpha = THREE.SrcColorFactor;
         model.material.blendDstAlpha = THREE.OneMinusDstAlphaFactor;

         // smooth texture rendering
         model.material.map.magfilter = THREE.LinearMipmapNearestFilter;
         model.material.map.minFilter = THREE.LinearMipmapNearestFilter;

         // this will help with borders in transparent renders as well
         model.material.transparent = true;

         model.material.map.flipY = false;

         frame_generation();

      });

   });

   function frame_generation() {

      // pixel_ratio can be increased or decreased.
      // affects internal resolution rendering
      // which then affects render time and quality
      // a very high resolution can be problematic and result in crop renders or crashes
      const pixel_ratio = renderData.quality;
      const width_render_r = width_render * pixel_ratio;
      const height_render_r = height_render * pixel_ratio;

      // RenderTarget vs MultisampleRenderTarget
      // One is webgl 1.0. Multisample is webgl 2.0
      // Multisample can do antialiasing. But probably won't work in macOS.
      // Further tests are needed
      // See: https://github.com/google/angle

      // const rt = new THREE.WebGLRenderTarget(width_render_r, height_render_r);
      const rt = new THREE.WebGLMultisampleRenderTarget(width_render_r, height_render_r);

      // setPixelRatio was called before, can't recall why
      // but it affects somehow the canvas resolution
      // setting the size of the renderer here to whatever
      // won't affect the final render, it's just the canvas display res
      // setting it before being multiplied by *pixel_ratio won't end up
      // cropping the image
      renderer.setPixelRatio(1);
      renderer.setSize(width_render, height_render);
      renderer.setRenderTarget(rt);
      renderer.render(scene_renderer, camera);

      renderer.setRenderTarget(rt);
      renderer.render(scene_renderer, camera);


      const buffer = new Uint8Array(parseInt(width_render_r * height_render_r * 4), 10);
      renderer.readRenderTargetPixels(rt, 0, 0, width_render_r, height_render_r, buffer);


      const export_png = sharp(buffer, {
         raw: {
            width: parseInt(width_render_r, 10),
            height: parseInt(height_render_r, 10),
            channels: 4
         }
      })
         .resize({
            width: width_render,
            height: height_render
         })
         .flip()
         .png({ compressionLevel: 1 })
         .toFile(renderData.render_output);


      export_png.then(() => {
         // usage of refresh_spawn() explained in index.js on
         // top of set_watcher_renders().
         setTimeout(function () {
            refresh_spawn()
         }, 350)
         status_update('Done<br>Waiting for new edits in Photoshop')
         latest_render_update(renderData.mockup_name)
      })


      // render again to display image in the DOM
      // pure aesthetic decision. Much faster than loading
      // the PNG file to the DOM.
      document.getElementById("render-view").replaceChildren();
      document.getElementById("render-view").appendChild(renderer.domElement);
      renderer.setRenderTarget(null);
      renderer.render(scene_renderer, camera);

      console.log('finish in: ' + (performance.now() - start))

   };

}

exports.render_scene = render_scene;