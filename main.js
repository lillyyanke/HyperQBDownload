const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),  // Preload script for secure IPC
            contextIsolation: true,  // Security 
            enableRemoteModule: true, // Security 
            nodeIntegration: true
        }
    });

    mainWindow.loadFile('index.html');
    // mainWindow.webContents.openDevTools(); // Open DevTools
}

app.on('ready', createWindow);

// Function to process files
function processFile(outputFolder, fileName, fileContent) {
    const currentDirectory = app.getPath('desktop');
    const filePath = path.join(outputFolder, fileName);
    const filePathWDir = path.join(currentDirectory, filePath);
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

// Extract the binary from the dist to the users computer
function extractBinary(bin) {
    const binaryPath = path.join(__dirname, 'bin', bin);
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'electron-'));
    const destinationPath = path.join(tempDir, bin);
    try{
        fs.copyFileSync(binaryPath, destinationPath);
        fs.chmodSync(destinationPath, 0o755); // Ensure executable permissions
        console.log('Binary extracted to temporary directory', destinationPath);
    }
    catch (err) {
        console.error('Failed to extract binary: ', err);
        throw err;
    }
    
    return destinationPath;
}

// Handle IPC request from renderer process
ipcMain.handle('process-files', async (event, data) => {
    try {
        const {
            models, p_hq, number_k, semantics, test_folder
            // model_1_init, model_1_trans, model_2_init, model_2_trans, p_hq,
            // number_k, quantifier_f, semantics, test_folder
        } = data;
        const desktopDirectory = app.getPath('desktop');
        const outputFolder = test_folder;
        const outputFolderWDir = path.join(desktopDirectory, outputFolder);
        const outputFile = path.join(desktopDirectory, outputFolder, 'HQ.qcir');

        console.log("output folder:", outputFolderWDir);
        if (!fs.existsSync(outputFolderWDir)) {
            fs.mkdirSync(outputFolderWDir, { recursive: true });
        }
        console.log("output file:", outputFile);
        if (!fs.existsSync(outputFile)) {
            fs.writeFileSync(outputFile, '');
            fs.chmod(outputFile, 0o755, (err) => {
                if (err) {
                    console.error(`Error setting permissions for ${outputFile}:`, err);
                } else {
                    console.log(`Permissions set to execute for ${outputFile}`);
                }
        });
        }

        // Process files for genqbf 
        // const I1 = processFile(outputFolder, 'I_1.bool', model_1_init);
        // const I2 = processFile(outputFolder, 'I_2.bool', model_2_init);
        // const R1 = processFile(outputFolder, 'R_1.bool', model_1_trans);
        // const R2 = processFile(outputFolder, 'R_2.bool', model_2_trans);
        // const P = processFile(outputFolder, 'P.hq', p_hq);

        // Process files for HyperRust
        let processedFiles = [];
        models.forEach((model, index) => {
            // model is an object like {model_a: "mini.smv"}
            for (const key in model) {
                if (model.hasOwnProperty(key)) {
                    console.log(`${key}: ${model[key]}`);
                    processedFiles.push(processFile(outputFolder, key, model[key]));
                }
            }
        });

        console.log("processedFiles", processedFiles);
        const P = processFile(outputFolder, 'p_hq', p_hq);
        
        // Extract binaries
        const genBinPath = extractBinary('genqbf');
        const quabsBinPath = extractBinary('quabs');
        const hyperRustBinPath = extractBinary('HyperRust');

        try {
            fs.accessSync(genBinPath, fs.constants.X_OK);
            console.log("permission fine");
        } catch (err) {
            throw new Error(`No execute permission for: ${genBinPath}`);
        }
        try {
            fs.accessSync(quabsBinPath, fs.constants.X_OK);
            console.log("permission fine");
        } catch (err) {
            throw new Error(`No execute permission for: ${quabsBinPath}`);
        }
        try {
            fs.accessSync(hyperRustBinPath, fs.constants.X_OK);
            console.log("permission fine");
        } catch (err) {
            throw new Error(`No execute permission for: ${hyperRustBinPath}`);
        }
        //const commandGen = `${genBinPath} -I ${I1} -R ${R1} -J ${I2} -S ${R2} -P ${P} -k ${number_k} -F ${quantifier_f} -f qcir -o ${outputFile} -sem ${semantics} -n --fast -new NN`;
        //console.log(`Command Gen: ${commandGen}`);
        //let genOutput = await execCommand(commandGen);
        //console.log(`GenOutput: ${genOutput}`);

        // HYPER RUST
        // const miniPath = path.join(__dirname, 'HyperRust', "mini", 'mini.smv');
        // const miniHQPath = path.join(__dirname, 'HyperRust', "mini", 'mini.hq');
        // Prepare command with all model files
        const modelFiles = processedFiles.join(' ');
        console.log(modelFiles);
        const commandHyperRust = `${hyperRustBinPath} ${modelFiles} ${P}`;
        console.log(`CommandHyperRust: ${commandHyperRust}`);
        let hyperOutput = await execCommand (commandHyperRust);
        console.log(`Hyper Output: ${hyperOutput}`);
        const outputPath = path.join(__dirname, 'outputs', "HQ.qcir");
        console.log(outputPath);
        fs.copyFileSync(outputPath, outputFile);
        const commandQuabs = `${quabsBinPath} ${outputFile}`; // Replace with outputFile to go back to genqbf
        console.log(`Executing second command: ${commandQuabs}`);
        let quabsOutput = await execCommand(commandQuabs);

        // Write the result to a file
        const resultFilePath = path.join(desktopDirectory, outputFolder, 'result.txt');
        fs.writeFileSync(resultFilePath, quabsOutput);
        return { result: quabsOutput};
    } catch (error) {
        console.error(`Error: ${error.message}`);
        return { error: error.message };
    }
});

// Helper function to execute shell commands
function execCommand(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            resolve(stdout);
            if (error) {
                console.error(`Error exec: ${error.message}`);
             }
        });
    });
}