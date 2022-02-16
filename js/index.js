let cf              = window.api.getConfig();

let activeBot       = '';
let activeTab       = 'navBot';
let botOnline       = false;

let botInfo;

let indexNavigation = document.getElementById('indexNavigation');
let body            = document.getElementsByTagName('BODY')[0];
let botButton       = document.getElementById('botButton');
let navBack         = document.getElementById('navBack');
let navBot          = document.getElementById('navBot');
let navGuilds       = document.getElementById('navGuilds');
let navCommands     = document.getElementById('navCommands');
let navEmbeds       = document.getElementById('navEmbeds');

let defaultTab      = {
    target: {
        id: 'navBot'
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

function startBotButton() {
    window.api.toMain('start-bot', cf.bots[activeBot]);
    botOnline = true;

    botButton.classList.add('online');

    botButton.removeEventListener('click', startBotButton);
    botButton.innerHTML = '...';
    setTimeout( () => {
        botButton.addEventListener('click', killBotButton);
        botButton.innerHTML = 'Kill Bot';
    }, 1500);                               // STOPS PEOPLE BREAKING THINGS
}

function displayBotInfo() {
    let botInfoElem = document.getElementById('botInfo');
    botInfoElem.innerHTML = `
        <div id="botAvatarContainer">
            <img class="avatar" src="${botInfo.avatarURL}">
        </div>
        <div id="botTextContainer">
            <h1>${botInfo.username}</h1>
            <p>ID: ${botInfo.id}</p>
            <p>Online: ${new Date(botInfo.readyAt).toLocaleString()}</p>
        </div>
    `;
    console.log(`[RENDER] displayed bot info for ${botInfo.tag}`);
}


function killBotButton() {
    window.api.toMain('kill-bot', null);
    botButton.removeEventListener('click', killBotButton);

    botButton.innerHTML = '...';
    setTimeout( () => {
        botButton.addEventListener('click', startBotButton);
        botButton.innerHTML = 'Start Bot';
    }, 1500);

    botButton.classList.remove('online');
    botOnline = false;
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

navBack.addEventListener('click', preventBackIfBotOnline);
botButton.addEventListener('click', startBotButton);
indexNavigation.addEventListener('click', selectTab);
window.addEventListener('beforeunload', () => {
    window.api.toMain('kill-bot', null);
    window.api.saveConfig(cf)
});