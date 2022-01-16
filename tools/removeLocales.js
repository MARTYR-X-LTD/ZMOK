exports.default = async function (context) {

   // https://www.electron.build/configuration/configuration#afterpack
   // removing all locales but en-US
   // app is set to use locale en-US in main.js with:
   // app.commandLine.appendSwitch('lang', 'en-US');
   const fs = require('fs');
   const path = require('path');

   var localeDir = path.join(context.appOutDir, 'locales/');
   var appDir = path.resolve(context.appOutDir);


   fs.readdir(localeDir, function (err, files) {
      // files is array of filenames (basename form)
      if (!(files && files.length)) return;
      for (const file of files) {
         //for (var i = 0, len = files.length; i < len; i++) {
         if (file.match(/en-US\.pak/) === null) {
            fs.unlinkSync(localeDir + file);
         }
      }
   });

   var delete_files = ["LICENSES.chromium.html", "LICENSE.electron.txt"]

   for (const file of delete_files) {
      fs.unlinkSync(path.join(appDir, file));

   }
}