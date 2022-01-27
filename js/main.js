const { app, BrowserWindow, ipcMain }   = require('electron');
const path                              = require('path');
const { Client, Intents }               = require('discord.js');

let mainWindow;
let activeBot = '';
let activeBotClient;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 720,
        minWidth: 600,
        height: 720,
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

function startBot(botObj) {
    mainWindow.webContents.send('to-console', `[MAIN] starting ${activeBot}.`);
    const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
    client.once('ready', () => { 
        mainWindow.webContents.send(
            'to-console', 
            `[MAIN] ${activeBot} is ready.`
        );
    });
    client.login(botObj.token);

    return client;
}

function killBot() {
    activeBotClient.destroy()
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
