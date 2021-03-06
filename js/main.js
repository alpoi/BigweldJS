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
    event.reply('set-activeBot-async', `[MAIN] set activeBot: ${activeBot}`);
});

ipcMain.on('get-activeBot', (event, arg) => {
    event.reply('get-activeBot', activeBot);
});

function getBotInfo(client) {
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

ipcMain.on('start-bot', (event, arg) => {
    activeBotClient = startBot(arg);
});

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
        );
        mainWindow.webContents.send(
            'get-guild-info',
            getGuildInfo(client)
        );
    });

    client.login(botObj.token).then( () => {
        mainWindow.webContents.send(
            'bot-online',
            null
        );
    })    .catch( (err) => {
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

ipcMain.on('kill-bot', (event, arg) => {
    activeBotClient = killBot();
});

function killBot() {
    if (!activeBotClient) { return null; }

    activeBotClient.destroy();
    mainWindow.webContents.send(
        'to-console',
        `[MAIN] killed ${activeBot}.`
    );

    return null;
}

ipcMain.on('get-guild-info', (event, arg) => {
    event.reply('get-guild-info', getGuildInfo(activeBotClient));
});

function getGuildInfo(client) {
    let guildInfo = new Map();
    for (let guild of client.guilds.cache) {
        guild = guild[1];   // guild is a "Collection" [str, Guild]
        guildInfo.set( guild.id, {
            id: guild.id,
            name: guild.name,
            icon: guild.icon,
            description: guild.description,
            nsfwLevel: guild.nsfwLevel,
            memberCount: guild.memberCount,
            ownerId: guild.ownerId,
            preferredLocale: guild.preferredLocale
        });
    }
    return guildInfo;
}

ipcMain.on('leave-guild', (event, arg) => {
    leaveGuild(arg);
});

function leaveGuild(id) {
    let guild = activeBotClient.guilds.cache.get(id);
    guild.leave();
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
