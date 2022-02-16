console.log("[PRELOAD] preload.js started.");

const p                                        = require('path');
const fs                                       = require('fs');
const { shell, contextBridge, ipcRenderer }    = require('electron');
const bigweldRoot                              = p.join(__dirname, '../');
const configPath                               = p.join(bigweldRoot, 'config.json');

contextBridge.exposeInMainWorld(
    'api', {
        invoke: invoke,
        toMainSync: toMainSync,
        toMain: toMain,
        fromMain: fromMain,
        getConfig: getConfig,
        saveConfig: saveConfig,
        openExternal: openExternal,
        createBotFiles: createBotFiles,
        deleteBotFiles: deleteBotFiles,
        createGuildFiles: createGuildFiles,
        deleteGuildFiles: deleteGuildFiles,
        createCommands: createCommands,
    }
);

function invoke(channel, ...args) {
    ipcRenderer.invoke(channel, ...args);
}

function toMainSync(channel, message) {
    ipcRenderer.sendSync(channel, message);
}

function fromMain(channel, handler) {
    ipcRenderer.on(channel, handler);
}

function toMain(channel, message) {
    ipcRenderer.send(channel, message);
}

function getConfig() {

    const freshConfig = {
        'bots': {}
    };

    try {
        let config = JSON.parse(
            fs.readFileSync(configPath)
        );
        console.log('Config loaded.');
        return config;
    } catch (err) {
        console.warn(err);
        console.log('Error loading config:', err);
        console.log('New config created.');
        return freshConfig;
    }
}

function saveConfig(cf) {
    let configJSON = JSON.stringify(cf, null, 2);
    fs.writeFileSync(configPath, configJSON);
    console.log('Config saved.')
}

function openExternal(url) {
    shell.openExternal(url);
}

function createCommands(bot, guilds, fileInput) {
    for (let file of fileInput.files) {
        for (let guild of guilds) {
            let dest = p.join(bigweldRoot, `bots/${bot.name}/commands/${guild}/${file.name}`);
            fs.copyFileSync(file.path, dest);
    
            bot['guilds'][guild]['commands'][file.name] = file.name;
            console.log(`${file.name} added to ${bot.name}:${guild}`);
        }
    }
}

function createGuildFiles(bot, guild) {
    let path = `bots/${bot}/commands/${guild}`
    makeDirectories(path);
}

function deleteGuildFiles(bot, guild) {
    let path = `bots/${bot}/commands/${guild}`;
    deleteDirectories(path);
}

function createBotFiles(bot) {
    let path = `bots/${bot}/commands/_global`;
    makeDirectories(path);
}

function deleteBotFiles(bot) {
    let path = `bots/${bot}`;
    fs.rm( p.join(bigweldRoot, path), { recursive: true, force: true }, () => {
        console.log( p.join(bigweldRoot, path) , 'deleted.' )
    });
}

function makeDirectories(path) {
    let paths = relPathToAbsPaths(path);
    for (const path of paths) {
        try {
            fs.mkdirSync(path);
            console.log( path, 'created.' );
        } catch (e) {
            if (e.code === 'EEXIST') continue;
        }
    }
}

function deleteDirectories(path) {
    let paths = relPathToAbsPaths(path).reverse();
    for (const path of paths) {
        fs.rmSync(path, { force: true });
        console.log('Deleted', path);
    }
}

// https://github.com/nodejs/node/issues/27293

function relPathToAbsPaths(path) {
    let paths = [];
    path = path.split('/');
    for (let i = 1; i < path.length + 1; i++) {
  	    paths.push(
              p.join( bigweldRoot, path.slice(0, i).join('/') )
        );
    }

    return paths;
}


console.log("[PRELOAD] window.api successfully exposed.")
console.log("[PRELOAD] preload.js completed.");