const fs = require('fs');

let cf = window.api.config;

let guildSelect = document.getElementById('guildSelect');
let commandFile = document.getElementById('commandFile')
let addCommand = document.getElementById('addCommand');

buildGuildSelect();

addCommand.addEventListener('click', createCommandHandler);

function buildGuildSelect() {
    for (let guild of cf.bots[bot]['guilds']) {
        guildSelect.innerHTML +=
            `
            <div class="guildCheckbox">
                <input type="checkbox" id="${guild}" name="${guild}">
                <label for="${guild}">${guild}</label>
            </div>
            `;
    }
}

function getSelectedGuilds() {
    let guilds = []
    for (let div of guildSelect.children) {
        if (div.className != 'guildCheckbox') { continue; }
        if (div.firstElementChild.checked) {
            guilds.append(div.firstElementChild.id);
        }
    }
    return guilds;
}

function createCommandHandler() {
    let guilds = getSelectedGuilds();
    window.api.createCommands(bot, guilds, commandFile);
}