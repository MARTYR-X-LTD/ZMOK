# Windows
Just run ‘yarn distW‘ and it will build an installer inside the dist folder.

# macOS
run
‘‘‘
nvm use 16
‘‘‘
and then
‘‘‘
CSC_KEY_PASSWORD=...
CSC_LINK=$(openssl base64 -in Developer-ID-Application-Certificates.p12)
yarn distM
‘‘‘

Where CSC_KEY_PASSWORD is a password that I set for the certificate, which is somewhere in my system.
Might need to scape special characters with ‘\‘.

Relevant link: https://til.simonwillison.net/electron/sign-notarize-electron-macos

## Development

For some reason, after building a universal package in macOS, it won't run in 'yarn start' (dev mode). Need to ‘rm -rf node_modules‘ and ‘yarn install‘ again to fetch the compatible binaries
for the current arquitecture in the dev machine.

