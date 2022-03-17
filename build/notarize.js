/* Based on https://kilianvalkhof.com/2019/electron/notarizing-your-electron-application/ */

const { notarize } = require("electron-notarize");

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== "darwin") {
    return;
  }

  const appName = context.packager.appInfo.productFilename;

  console.log(
    `Notarizing ${appName} found at ${appOutDir}/${appName}.app with Apple ID ${process.env.APPLEID}. This may take a couple of minutes, depending on the upload speed and Apple servers...`
  )

  try {
    await notarize({
      appBundleId: "com.martyr.ZMOK",
      appPath: `${appOutDir}/${appName}.app`,
      appleId: process.env.APPLEID,
      appleIdPassword: process.env.APPLEIDPASS,
    })
  } catch (error) {
      console.error(error)
  }

  console.log(`Done notarizing ${appName}`)

};