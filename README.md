# em-install
Practice area for installation scripts

## Create segger zip file for distribution

The script will:
- download the revision specified of Segger's Embedded Studio (defaults to 630)
- unzip the installer
- run the installer to install into a temp folder
- strip out all the unneeded files and folders
- create the linux-x64.zip file for the em-sdk distribution

```bash
cd em-install
# Uncomment the below to set the version number -- the commented out versions are the default values
# export SEGGER_EMBEDDED_STUDIO_VERSION=630
# export GCC_VERSION=10.3.1
npm start
```
