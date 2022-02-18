# Windows
Just run ‘yarn distW‘ and it will build an installer inside the dist folder.

# macOS
‘‘‘
CSC_KEY_PASSWORD=...
CSC_LINK=$(openssl base64 -in Developer-ID-Application-Certificates.p12)
yarn distM
‘‘‘

Where CSC_KEY_PASSWORD is a password that I set for the certificate, which is somewhere in my system.
Might need to scape special characters with ‘\‘.

Relevant link: https://til.simonwillison.net/electron/sign-notarize-electron-macos



