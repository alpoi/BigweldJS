let cf              = window.api.getConfig();

let activeBot       = '';
let activeTab       = 'navBot';
let botOnline       = false;

let botInfo;

let indexNavigation = document.getElementById('indexNavigation');
let body            = document.getElementsByTagName('BODY')[0];
let botButton       = document.getElementById('botButton');
let botConsole      = document.getElementById('botConsole');
let botInfoElem     = document.getElementById('botInfo');
let navBack         = document.getElementById('navBack');
let navBot          = document.getElementById('navBot');
let navGuilds       = document.getElementById('navGuilds');
let navCommands     = document.getElementById('navCommands');
let navEmbeds       = document.getElementById('navEmbeds');

let defaultTab      = {
    target: {
        id: 'navGuilds'
    }
}

selectTab(defaultTab, loadDefault = true);

window.api.fromMain('get-activeBot-async', (event, arg) => {
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

window.api.toMain('get-activeBot-async', null);

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

/* ------------------------------==≡{ BOT }≡==------------------------------ */

function startBotButton() {
    botButton.classList.add('online');
    botButton.removeEventListener('click', startBotButton);
    botButton.innerHTML = '...';

    window.api.toMain('start-bot', cf.bots[activeBot]);
    botOnline = true;
}

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

function DOMElem(id) {
    return document.getElementById(id);
}

window.api.fromMain('get-guild-info', (event, arg) => {
    guilds = arg;
    populateGuildList();
    initialGuildSelect();
    updateGuildInfo();
});

function populateGuildList() {
    clearGuildList();
    
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

    DOMElem("guildList").addEventListener('click', guildSelectHandler);
    console.log(`[RENDER] populated guild list for ${botInfo.username}`);
}

function initialGuildSelect() {
    [activeGuild] = guilds.values();
    DOMElem(activeGuild.id).classList.add("selected");
}

function updateGuildInfo() {
    DOMElem("guildAvatar").src              = `https://cdn.discordapp.com/icons/${activeGuild.id}/${activeGuild.icon}.png`;
    DOMElem("guildName").innerHTML          = activeGuild.name;
    DOMElem("guildID").innerHTML            = "ID: " + activeGuild.id;
    DOMElem("guildOwner").innerHTML         = "Owner: " + activeGuild.ownerId;
    DOMElem("guildMemberCount").innerHTML   = "Members: " + activeGuild.memberCount;
}

function guildSelectHandler(event) {
    let elem = event.target;

    if (elem.classList.contains("guildAvatar") 
     || elem.classList.contains("guildName")  ) {
        elem = elem.parentElement.parentElement;
    } else if (elem.classList.contains("guildAvatarContainer") 
            || elem.classList.contains("guildTextContainer")  ) {
        elem = elem.parentElement;
    }

    if ((!elem.classList.contains("guild")) || 
          elem.classList.contains("selected")) { return; }
    
    DOMElem(activeGuild.id).classList.remove("selected"); // deselect previous

    activeGuild = guilds.get(elem.id); // set new

    elem.classList.add("selected"); // select new

    updateGuildInfo();

}

function clearGuildList() {
    DOMElem("guildList").innerHTML = "";
    DOMElem("guildList").removeEventListener('click', guildSelectHandler);
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

/* ---------------------------==≡{ LISTENERS }≡==--------------------------- */

navBack.addEventListener('click', preventBackIfBotOnline);
botButton.addEventListener('click', startBotButton);
indexNavigation.addEventListener('click', selectTab);
window.addEventListener('beforeunload', () => {
    window.api.toMain('kill-bot', null);
    window.api.saveConfig(cf)
});