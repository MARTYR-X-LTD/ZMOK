# Development

App is based on **Node.js** and **Electron**. 

## Windows

Don't use WSL. Install and run everything from native Windows.

`--ignore-optional` is **mandatory**. Otherwise, node-mac-permissions will give problems. If you've messed up this step, just delete the folder node_modules and proceed to the next command.

Use Node `22.x`. If you have nvm:

```
nvm install 22
nvm use 22
```

And then

```
npm install --ignore-optional
```

## macOS

Use Node `22.x`. If you have nvm:

```
nvm install 22
nvm use 22
```

# Compilation

## Windows

Run the following command as **Administrator**:

```
npm run distW
```

It will build a silent installer inside the dist folder.

## macOS

```
npm run distM
```

Build is inside the dist folder.

It will generate a standalone universal build that runs in ARM (Apple Silicon) and x64 (Intel CPUs).

### → for a simple build without sign and notarization

Set `"notarize": false,` in `package.json`

Then, run `npm distM`
