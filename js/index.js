let cf              = window.api.getConfig();

let activeBot       = '';
let activeTab       = 'navBot';
let botOnline       = false;

let botInfo;

function DOMElem(id) {
    return document.getElementById(id);
}

let indexNavigation = DOMElem('indexNavigation');
let botButton       = DOMElem('botButton');
let botConsole      = DOMElem('botConsole');
let botInfoElem     = DOMElem('botInfo');
let navBack         = DOMElem('navBack');
let navBot          = DOMElem('navBot');
let navGuilds       = DOMElem('navGuilds');
let navCommands     = DOMElem('navCommands');
let navEmbeds       = DOMElem('navEmbeds');
let body            = document.getElementsByTagName('BODY')[0];

let defaultTab      = {
    target: {
        id: 'navGuilds'
    }
}

selectTab(defaultTab, loadDefault = true);

window.api.toMain('get-activeBot', null);

window.api.fromMain('get-activeBot', (event, arg) => {
    activeBot = arg;
    console.log(`[MAIN] activeBot: ${activeBot}`)
    setWindowTitle(`BigweldJS • Bot - ${activeBot}`)
});

window.api.fromMain('to-console', (event, arg) => {
    console.log(arg);
});

window.api.fromMain('error-to-console', (event, arg) => {
    console.error(arg);
});

window.api.fromMain('get-bot-info', (event, arg) => {
    botInfo = arg;
    displayBotInfo();
});

window.api.fromMain('invalid-token', (event, arg) => {
    window.location.href = 'login.html';
});

window.api.fromMain('bot-online', (event, arg) => {
    botButton.addEventListener('click', killBotButton);
    botButton.innerHTML = 'Kill Bot';
    botConsoleLog("Connected.", type="success");
})

function selectTab(event, loadDefault = false) {
    if (!loadDefault) {
        if (!event.target.classList.contains('navOption')) { return; }
        if (event.target.id == activeTab) { return; }
    }

    if (activeTab) {
        document.getElementById(activeTab)
                .classList.remove('selected');
        document.getElementById('content' + activeTab.slice(3))
                .classList.add('hidden');
    }

    activeTab = event.target.id;
    document.getElementById(activeTab).classList.add('selected');

    let title = activeTab.slice(3);

    document.getElementById('content' + title).classList.remove('hidden');

    setWindowTitle(`BigweldJS • ${title} - ${activeBot}`);
}

function setWindowTitle(string) {
    document.title = string;
}

indexNavigation.addEventListener('click', selectTab);
navBack.addEventListener('click', preventBackIfBotOnline);

/* ------------------------------==≡{ BOT }≡==------------------------------ */

function startBotButton() {
    botButton.classList.add('online');
    botButton.removeEventListener('click', startBotButton);
    botButton.innerHTML = '...';

    window.api.toMain('start-bot', cf.bots[activeBot]);
    botOnline = true;
}

botButton.addEventListener('click', startBotButton);

function displayBotInfo() {
    document.getElementById('botInfoAvatar').src = botInfo.avatarURL;
    document.getElementById('botInfoUsername').innerHTML = botInfo.username;
    document.getElementById('botInfoID').innerHTML = `ID: ${botInfo.id}`;
    document.getElementById('onlineIndicator').innerHTML = `🟢 Online: ${new Date(botInfo.readyAt).toLocaleString()}`
    document.getElementById('botInfoHeader').classList.remove('hidden');
    document.getElementById('botConsole').classList.remove('hidden');

    console.log(`[RENDER] displayed bot info for ${botInfo.username}`);
}

function killBotButton() {
    window.api.toMain('kill-bot', null);
    botButton.removeEventListener('click', killBotButton);

    let onlineIndicator = document.getElementById('onlineIndicator');
    onlineIndicator.innerHTML = `🔴 Offline: ${new Date().toLocaleString()}`

    botButton.innerHTML = '...';

    setTimeout( () => {
        botButton.addEventListener('click', startBotButton);
        botButton.innerHTML = 'Start Bot';
    }, 1500);                                   // STOPS PEOPLE BREAKING THINGS

    botButton.classList.remove('online');
    botOnline = false;

    botConsoleLog("Disconnected.", type="error");



}

function preventBackIfBotOnline() {
    let botOfflineText = document.getElementById('botOfflineText');
    let botOnlineText  = document.getElementById('botOnlineText');

    if (botOnline) {
        botOfflineText.firstElementChild.href = '#';
        botOfflineText.style.textDecoration = 'line-through';
        botOnlineText.classList.remove('hidden');
    } else {
        botOfflineText.firstElementChild.href = 'login.html';
        botOfflineText.style.textDecoration = 'none';
        botOnlineText.classList.add('hidden');
    }
}

function botConsoleLog(content, type = "default") {
    let isScrolledToBottom = botConsole.scrollHeight 
                           - botConsole.clientHeight 
                          <= botConsole.scrollTop + 1;
    botConsole.innerHTML += `<p class=${type}>
        [${new Date().toLocaleTimeString()}] ${content}
    </p>`;

    if (isScrolledToBottom) {
        botConsole.scrollTop = botConsole.scrollHeight 
                             - botConsole.clientHeight;
    }
    
}

const consoleTest = {
    error() {
        botConsoleLog("sample error", type = "error");
    },
    success() {
        botConsoleLog("sample success", type = "success");
    },
    warn() {
        botConsoleLog("sample warning", type = "warn");
    },
    default() {
        botConsoleLog("sample message");
    },
    all() {
        this.default();
        this.success();
        this.warn();
        this.error();
    },
    async height(instant = false) {
        for (let i = 0; i < 100; i++) {
            if (instant) {
                botConsoleLog("foo bar baz");
            } else {
                await new Promise( (resolve, reject) => {
                    setTimeout( () => {
                        botConsoleLog("foo bar baz");
                        resolve();
                    }, 1000)
                });
            }
        }
    }
}

/* -----------------------------==≡{ GUILDS }≡==---------------------------- */

let guilds;
let activeGuild;

window.api.fromMain('get-guild-info', (event, arg) => {
    guilds = arg;
    populateGuildList();
    initialGuildSelect();
    updateGuildInfo();
});

function refreshGuildList() {
    console.log("[RENDER] refreshing guild list");
    window.api.toMain('get-guild-info');
}

function populateGuildList() {
    clearGuildList();

    DOMElem("guildList").appendChild(createRefreshButton());

    guilds.forEach( (guild) => {
        DOMElem("guildList").innerHTML +=
            `
                <div class="guild" id="${guild.id}">
                    <div class="guildAvatarContainer">
                        <img 
                            class="guildAvatar" 
                            src="https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png"
                        >
                    </div>
                    <div class="guildTextContainer">
                        <h1 class="guildName">${guild.name}</h1>
                    </div>
                </div>
            `;
    });

    DOMElem("guildList").classList.remove("hidden");
    DOMElem("guildInfo").classList.remove("hidden");

    console.log(`[RENDER] populated guild list for ${botInfo.username}`);
}

function initialGuildSelect() {
    [activeGuild] = guilds.values();
    DOMElem(activeGuild.id).classList.add("selected");
}

function updateGuildInfo() {
    // Update header
    DOMElem("guildAvatar").src              = `https://cdn.discordapp.com/icons/${activeGuild.id}/${activeGuild.icon}.png`;
    DOMElem("guildName").innerHTML          = activeGuild.name;
    DOMElem("guildID").innerHTML            = "ID: " + activeGuild.id;
    DOMElem("guildOwner").innerHTML         = "Owner: " + activeGuild.ownerId;
    DOMElem("guildMemberCount").innerHTML   = "Members: " + activeGuild.memberCount;
    // Show info if hidden
    DOMElem("leaveGuild").classList.remove("hidden");
    DOMElem("guildInfo").classList.remove("hidden");
}

function guildListClickHandler(event) {
    let elem = event.target;

    while (elem.id != "guildList") {
        if (elem.id == "refreshGuilds") {
            refreshGuildList();
            return;
        }

        if (elem.classList.contains("guild")) {
            if (elem.classList.contains("selected")) { return; }
            
            if (activeGuild) { // deselect previous
                DOMElem(activeGuild.id).classList.remove("selected"); 
            }

            activeGuild = guilds.get(elem.id); // set new

            elem.classList.add("selected"); // select new

            updateGuildInfo();
            return;
        }
        elem = elem.parentElement;
    }
}

DOMElem("guildList").addEventListener('click', guildListClickHandler);

function createRefreshButton() {
    let outerDiv = document.createElement("div");
    let innerDiv = document.createElement("div");
    let header = document.createElement("h1");
    let text = document.createTextNode("Refresh");

    outerDiv.id = "refreshGuilds";
    innerDiv.classList.add("guildTextContainer");

    header.appendChild(text);
    innerDiv.appendChild(header);
    outerDiv.appendChild(innerDiv);

    return outerDiv;
}

function clearGuildList() {
    DOMElem("guildList").innerHTML = " ";
}

function guildListHeightTest(n) {
    for (let i = 0; i < n; i++) {
        DOMElem("guildList").innerHTML +=
            `
                <div class="guild" id="testGuild-${i}">
                    <div class="guildAvatarContainer">
                        <img 
                            class="guildAvatar" 
                            src="img/clyde.svg"
                        >
                    </div>
                    <div class="guildTextContainer">
                        <h1 class="guildName">testGuild-${i}</h1>
                    </div>
                </div>
            `;
    }
}

function leaveGuildHandler() {
    window.api.toMain('leave-guild', activeGuild.id);
    DOMElem(activeGuild.id).remove();
    activeGuild = null;
    DOMElem("guildInfo").classList.add("hidden");
}

DOMElem("leaveGuild").addEventListener('click', leaveGuildHandler);

/* ---------------------------==≡{ LISTENERS }≡==--------------------------- */

window.addEventListener('beforeunload', () => {
    window.api.toMain('kill-bot', null);
    window.api.saveConfig(cf)
});