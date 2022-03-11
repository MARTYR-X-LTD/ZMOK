# Development

App is based on **Node.js** and **Electron**. 

- I recommend to use `nvm` to manage installations and versions of `node` on your system.
- I'm using **yarn**. I don't like **npm**. You're on your own with that. It gave me some problems and decided to just use **yarn**.

## Windows

Don't use WSL. Install and run everything from native Windows.

`--ignore-optional` is **mandatory**. Otherwise, node-mac-permissions will give problems. If you've messed up this step, just delete the folder node_modules and proceed to the next command.

Use Node `16.x` or `17.x`. If you have nvm:

```
nvm use 17
```

And then

```
yarn install --ignore-optional
```

## macOS

Install Xcode from the App Store. ~50 GB aproximately. Maybe a bit more.

For some reason, after compiling a universal package in macOS for this app, it won't run in `yarn start` (to keep developing it or whatever). You need to `rm -rf node_modules` and `yarn install` again to fetch the compatible binaries for the current arquitecture in the dev machine.

Use Node `16.x`. 17.x won't work. If you have nvm:

```
nvm use 16
```

# Compilation

## Windows

```
yarn distW
```

It will build a silent installer inside the dist folder.

## macOS

These all will generate a standalone universal build that will run in ARM (Apple Silicon) and x64 (Intel CPUs).

### → for a simple build without sign and notarization

Search the line `"afterSign": "build/notarize.js",` and delete it from `package.json`.

Then, run

```
yarn distM
```

Build is inside the dist folder.

### → for a signed and notarized build

> Requires to be part of the Apple Developer Program (~100 USD)

1. Follow these steps to generate a Developer-ID-Application-Certificate and convert it to a .p12 file: https://til.simonwillison.net/electron/sign-notarize-electron-macos

2. Open Xcode. Go to somewhere in the settings, where you can manage log in sessions, and log in with you Apple account. By doing it, Xcode will fetch the appropiate certificates automatically to your system to be able to sign the application correctly. Otherwise you will get errors related to untrusted certificates.

3. Run these commands, replacing everything with your stuff:

```
APPLEID=my-dedicated-appleid \
APPLEIDPASS=app-specific-password \
CSC_KEY_PASSWORD=...
CSC_LINK=$(openssl base64 -in Developer-ID-Application-Certificates.p12)
yarn distM
```

Build is inside the dist folder.
