const { app, BrowserWindow, ipcMain, dialog }   = require('electron');
const path                                      = require('path');
const { Client, Intents }                       = require('discord.js');

let mainWindow;
let activeBot = '';
let activeBotClient;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 700,
        minWidth: 700,
        height: 700,
        minHeight: 700,
        icon: path.join(__dirname, '../bigweld.png'),
        backgroundColor: '#292b2f',
        webPreferences: {
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        }
    });

    mainWindow.setMenuBarVisibility(false);
    mainWindow.setIcon(path.join(__dirname, '../bigweld.png'));
    mainWindow.loadFile(path.join(__dirname, '../login.html'));
}

function createAlertModal(title, message, type = "none") {
    dialog.showMessageBox(
        mainWindow, { 
            message: message,
            type: type,
            buttons: ['OK'],
            defaultId: 0,
            title: title,
        })
}

ipcMain.on('set-activeBot', (event, arg) => {
    activeBot = arg;
    event.returnValue = `[MAIN] set activeBot: ${activeBot}`;
});

ipcMain.on('set-activeBot-async', (event, arg) => {
    activeBot = arg;
    event.reply('set-activeBot-async', `[MAIN] set activeBot: ${activeBot}`);
});

ipcMain.on('get-activeBot-async', (event, arg) => {
    event.reply('get-activeBot-async', activeBot);
});

ipcMain.on('get-activeBot', (event, arg) => {
    event.returnValue = activeBot;
});

ipcMain.on('start-bot', (event, arg) => {
    activeBotClient = startBot(arg);
});

ipcMain.on('kill-bot', (event, arg) => {
    activeBotClient = killBot();
});


function getBotInfo(client) {
    console.log(client);
    console.log(client.guilds.cache);
    const botInfo = {
        "avatarURL": "https://cdn.discordapp.com/avatars/" 
                    + client.user.id + "/" + client.user.avatar + ".png",
        "id": client.user.id,
        "discriminator": client.user.discriminator,
        "username": client.user.username,
        "readyAt": client.readyAt
    };
    return botInfo;
}

function startBot(botObj) {
    mainWindow.webContents.send('to-console', `[MAIN] starting ${activeBot}.`);
    const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
    client.once('ready', () => { 
        mainWindow.webContents.send(
            'to-console', 
            `[MAIN] ${activeBot} is ready.`
        );
        mainWindow.webContents.send(
            'get-bot-info',
            getBotInfo(client)
        )
    });

    client.login(botObj.token).catch( (err) => {
        mainWindow.webContents.send(
            'error-to-console',
            `[ERROR] ${err}`
        );
        mainWindow.webContents.send(
            'invalid-token',
            null
        )
        createAlertModal("Error", 
                         "Invalid bot token. Returning to the login screen.", 
                         "error");
        killBot();
        return;
    });
    
    return client;
}

function killBot() {
    if (!activeBotClient) { return null; }

    activeBotClient.destroy();
    mainWindow.webContents.send(
        'to-console',
        `[MAIN] killed ${activeBot}.`
    );

    return null;
}

app.whenReady().then( () => {
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
