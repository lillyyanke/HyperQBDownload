// const { app, BrowserWindow } = require('electron');
// const path = require('path');
// const { exec } = require('child_process');
const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');


function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),  // Preload script for secure IPC
            contextIsolation: true,  // Security feature
            enableRemoteModule: true, // Security feature
            nodeIntegration: true
        }
    });

    mainWindow.loadFile('index.html');
    mainWindow.webContents.openDevTools(); // Open DevTools

    // Open DevTools for main process (optional, for debugging main.js)
    mainWindow.webContents.once('did-frame-finish-load', () => {
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    });
}

app.on('ready', createWindow);

// Ensure console output from main.js is visible
console.log('Main process started.');

// Function to process files
function processFile(outputFolder, fileName, fileContent) {
    const currentDirectory = app.getAppPath();
    //const test = '/Users/lillianyanke/Research2024/LocalUI/test/I_1.bool';

    const filePath = path.join(outputFolder, fileName);
    const filePathWDir = path.join(currentDirectory, filePath);
    //const filePathWDir = filePath; 

    console.log(`File path: ${filePath}`);
    console.log(`File path with dir: ${filePathWDir}`);

    // Check if content is provided directly
    if (fileContent) {
        if (!fs.existsSync(filePathWDir)) {
            console.log(`File ${filePathWDir} does not exist, creating a new file`);
            fs.writeFileSync(filePathWDir, fileContent);
        } else {
            console.log(`File ${filePath} exists!`);
        }
    } else {
        if (!fs.existsSync(filePath)) {
            throw new Error(`No input provided or file does not exist for ${fileName}.`);
        }
    }

    return filePathWDir;
}

// Handle IPC request from renderer process
ipcMain.handle('process-files', async (event, data) => {
    try {
        const {
            model_1_init, model_1_trans, model_2_init, model_2_trans, p_hq,
            number_k, quantifier_f, semantics, test_folder
        } = data;
        // console.log(model_1_init);
        // console.log(model_2_init);
        // console.log(test_folder);
        console.log(number_k);
        console.log(quantifier_f);
        console.log(semantics);

        const currentDirectory = app.getAppPath();
        const outputFolder = test_folder;
        const outputFile = path.join(currentDirectory, outputFolder, 'HQ.qcir');

        const genPath = path.join(currentDirectory, 'bin/genqbf');
        const quabsPath = path.join(currentDirectory, 'bin/quabs');
        // Check if the genqbf executable exists and has execution permissions
        if (!fs.existsSync(genPath)) {
            throw new Error(`Executable not found: ${genPath}`);
        }
        if (!fs.existsSync(quabsPath)) {
            throw new Error(`Executable not found: ${quabsPath}`);
        }
        console.log("output folder:",outputFolder);
        if (!fs.existsSync(outputFolder)) {
            fs.mkdirSync(outputFolder, { recursive: true });
            fs.chmod(outputFolder, 0o755, (err) => {
                if (err) {
                    console.error(`Error setting permissions for ${outputFolder}:`, err);
                } else {
                    console.log(`Permissions set to execute for ${outputFolder}`);
                }
            });
        }

        // if (!fs.existsSync(outputFile)) {
        //     fs.writeFileSync(outputFile, '');
        //     fs.chmod(outputFile, 0o755, (err) => {
        //         if (err) {
        //             console.error(`Error setting permissions for ${outputFile}:`, err);
        //         } else {
        //             console.log(`Permissions set to execute for ${outputFile}`);
        //         }
        // });
        // }


        const inputI1 = processFile(outputFolder, 'I_1.bool', model_1_init);
        const inputI2 = processFile(outputFolder, 'I_2.bool', model_2_init);
        const inputR1 = processFile(outputFolder, 'R_1.bool', model_1_trans);
        const inputR2 = processFile(outputFolder, 'R_2.bool', model_2_trans);
        const inputP = processFile(outputFolder, 'P.hq', p_hq);

        // const I1 = currentDirectory + '/' + inputI1;
        // const I2 = currentDirectory + '/' + inputI2;
        // const R1 = currentDirectory + '/' + inputR1;
        // const R2 = currentDirectory + '/' + inputR2;
        // const P = currentDirectory + '/' + inputP;

        const I1 = inputI1;
        const I2 = inputI2;
        const R1 = inputR1;
        const R2 = inputR2;
        const P = inputP;

        //const commandGen = `${currentDirectory}/bin/genqbf -I ${inputI1} -R ${inputR1} -J ${inputI2} -S ${inputR2} -P ${inputP} -k ${number_k} -F ${quantifier_f} -f qcir -o ${outputFile} -sem ${semantics} -n --fast -new NN`;
       
        // TRY With full path
        const commandGen = `${currentDirectory}/bin/genqbf -I ${I1} -R ${R1} -J ${I2} -S ${R2} -P ${P} -k ${number_k} -F ${quantifier_f} -f qcir -o ${outputFile} -sem ${semantics} -n --fast -new NN`;
        //const commandGen = `${currentDirectory}/dist/add2 ${I1} ${I2} ${outputFile}`;

        try {
            fs.accessSync(genPath, fs.constants.X_OK);
        } catch (err) {
            throw new Error(`No execute permission for: ${genPath}`);
        }
        try {
            fs.accessSync(quabsPath, fs.constants.X_OK);
            console.log("Permission for quabs");
        } catch (err) {
            throw new Error(`No execute permission for: ${quabsPath}`);
        }

        
        console.log(`Command Gen: ${commandGen}`);
        // let testOutput = await execCommand(commandGen);

        // return { result: testOutput };

        let genOutput = await execCommand(commandGen);

        console.log(`Command error: ${genOutput}`);
        if (!fs.existsSync(outputFile)) {
            throw new Error('File not generated');
        }

        const commandQuabs = `${currentDirectory}/bin/quabs ${outputFile}`;
        console.log(`Executing second command: ${commandQuabs}`);
        
        try {
            fs.accessSync(outputFile, fs.constants.X_OK);
        } catch (err) {
            throw new Error(`No execute permission for: ${outputFile}`);
        }
        let quabsOutput = await execCommand(commandQuabs);

        return { result: quabsOutput };
    } catch (error) {
        console.error(`Error: ${error.message}`);
        return { error: error.message };
    }
});

// Helper function to execute shell commands
function execCommand(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            //console.error(`Error exec: ${error.message}`);
            resolve(stdout);
            // if (error && error.code !== 10) {
            //     console.error(`Error exec: ${error.message}`);
            //     console.error(`Command output:\n${stderr || stdout}`);
            //     console.error(`Command failed with code ${error.code}`);
            //     console.error(`Error details: ${JSON.stringify(error, null, 2)}`);
            //     reject(stderr || stdout);
            // } else {
            //     resolve(stdout || stderr);
            // }
        });
    });
}

 // IPC handler to run the binary and get the result
// ipcMain.handle('run-binary', async (event, model1Init, model1Trans) => {
//     return new Promise((resolve, reject) => {
//         const binaryPath = path.join(__dirname, 'dist', 'add');

//         execFile(binaryPath, [model1Init, model1Trans], (error, stdout, stderr) => {
//             if (error) {
//                 reject(error);
//             } else {xs
//                 resolve(stdout);
//             }
//         });
//     });
// });