const axios = require('axios');
const { execSync } = require('child_process')
const { createWriteStream, mkdirSync, rmSync, statSync, writeFileSync, readdirSync, existsSync } = require('fs');
const { join } = require('path')
const { homedir } = require('os')
const decompress = require('decompress');

const seggerVersion = process.env.SEGGER_EMBEDDED_STUDIO_VERSION || '630';

downloadFile = async (fileUrl, outputLocationPath) => {
    console.log(`Downloading\n... from ${fileUrl}\n... to ${outputLocationPath}`);
    const writer = createWriteStream(outputLocationPath);
    return axios.get(fileUrl, {
        responseType: 'stream',
    }).then(response => {
        return new Promise((resolve, reject) => {
            response.data.pipe(writer);
            let error = null;
            writer.on('error', err => {
                error = err;
                writer.close();
                reject(err);
            });
            writer.on('close', () => {
                if (!error) {
                    const fileInfo = statSync(outputLocationPath)
                    console.log("... Download complete", (fileInfo.size / (1024.0*1024.0)).toFixed(1), "MiB")
                    resolve(true);
                }
            });
        });
    });
}

const getSegger = async () => {
    const toolsFoldername = join(__dirname, 'tools/segger/ses-arm')
    const downloadsFoldername = join(__dirname, 'downloads/segger')
    const tarballFilename = `Setup_EmbeddedStudio_ARM_v${seggerVersion}_linux_x64.tar.gz`
    const seggerUrl = `https://www.segger.com/downloads/embedded-studio/${tarballFilename}`
    const tarballFilepath = join(downloadsFoldername, tarballFilename)
    const yesFilepath = join(downloadsFoldername, 'inputs.txt')
    const execFilename = join(downloadsFoldername, `arm_segger_embedded_studio_v${seggerVersion}_linux_x64/install_segger_embedded_studio`)
    const foldersToDelete = [
        'html', 'llvm', 'packages', 'samples', 'source', 'targets'
    ]
    const filesToKeep = [
        { folder: 'bin', keepers: ['segger-as', 'segger-cc', 'segger-ld', 'version.txt'] },
        { folder: 'lib', keepers: ['libc_v6m_t_le_eabi_small.a'] }
    ]
    const zipFolder = join(__dirname, `zips/segger-${seggerVersion}`)
    const zipFilename = join(zipFolder, 'linux-x64.zip')
    // // download from segger
    // mkdirSync(downloadsFoldername, { recursive: true });
    // await downloadFile(seggerUrl, tarballFilepath);
    // // decompress installer
    // console.log(`Unzipping Installer\n... ${tarballFilepath}`)
    // const untarredFiles = await decompress(tarballFilepath, downloadsFoldername)
    // console.log(`... Decompressed ${untarredFiles.length} files`)
    // install into tools folder
    writeFileSync(yesFilepath, 'yes\n')
    rmSync(toolsFoldername, { recursive: true, force: true })
    mkdirSync(toolsFoldername, { recursive: true })
    console.log(`Installing\n... into ${toolsFoldername}`)
    execSync(`${execFilename} --copy-files-to ${toolsFoldername} < ${yesFilepath}`)
    // delete unneeded files from tools folder
    console.log(`Deleting unneeded files/folders`)
    foldersToDelete.forEach(folderToDelete => {
        const folderPath = join(toolsFoldername, folderToDelete)
        if (existsSync(folderPath)) {
            console.log('... removing folder', folderPath)
            rmSync(folderPath, { recursive: true, force: true })
        }
    })
    filesToKeep.forEach(fileToKeep => {
        const folderPath = join(toolsFoldername, fileToKeep.folder)
        const filesInFolder = readdirSync(folderPath)
        console.log('... removing files from', folderPath)
        filesInFolder.forEach(fileInFolder => {
            if (!fileToKeep.keepers.includes(fileInFolder)) {
                const filePath = join(folderPath, fileInFolder)
                rmSync(filePath, { recursive: true, force: true })
            }
        })
    })
    // zip up the remaining
    mkdirSync(zipFolder, { recursive: true })
    console.log(`Zipping\n... from ${toolsFoldername}\n... to ${zipFilename}`)
    rmSync(zipFilename, { recursive: true, force: true })
    execSync(`cd ${toolsFoldername} && zip -r ${zipFilename} *`)
    console.log(`Done!`)
}

getSegger()
