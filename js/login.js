let cf = window.api.getConfig();
let selectedBot = '';
let activeBot = '';

let botList         = document.getElementById('botList');
let botNameInput    = document.getElementById('botNameInput');
let botClientInput  = document.getElementById('botClientInput');
let botTokenInput   = document.getElementById('botTokenInput');
let addBot          = document.getElementById('addBot');
let proceed         = document.getElementById('proceed');

for (const bot in cf.bots) {
    updateBotList(cf.bots[bot]);
}

window.api.fromMain('set-activeBot-async', (event, arg) => {
    console.log(arg);
});

window.api.fromMain('get-activeBot-async', (event, arg) => {
    activeBot = arg;
    console.log(`[MAIN] activeBot: ${activeBot}`);
});

function validateName() {

    let name = botNameInput.value;

    if (cf.bots[name]) {
        createMsgModal(`Bot with name "${name}" already exists.`);
        return false;
    }

    if (/[^\d\w\(\)-]/.test(name)) {
        createMsgModal("Invalid characters in name!<br>Allowed: A-z 0-9 _ - ( )");
        return false;
    }

    if (name.length === 0) {
        createMsgModal("Name cannot be blank!");
        return false;
    }

    if (botTokenInput.value.length === 0) {
        createMsgModal("Token cannot be blank!");
        return false;
    }

    if (botClientInput.value.length === 0) {
        createMsgModal("Client ID cannot be blank!")
    }

    return true;
}

function addNewBot(event) {
    event.preventDefault();

    if (!validateName()) {
        return;
    }

    let bot = {
        'token': botTokenInput.value,
        'name': botNameInput.value,
        'client': botClientInput.value,
        'imageURL': 'img/clyde.svg',
        'guilds': {
            '_global': {
                'commands': {}
            }
        }
    }

    cf.bots[bot.name] = bot;

    botTokenInput.value = '';
    botNameInput.value = '';
    botClientInput.value = '';

    window.api.createBotFiles(bot.name);
    updateBotList(bot);

    if (botList.childElementCount > 3) {
        botList.scrollTop = botList.scrollHeight - botList.clientHeight;
    }
}

function deleteBot(elem) {
    delete cf.bots[elem.id];             // remove from config
    elem.remove();                       // remove from DOM
    window.api.deleteBotFiles(elem.id);  // remove from files

    switch (botList.children.length) {          // modify botList height
        case 3:
            botList.classList.remove('scrollable');
            break;
        case 2:
        case 1:
        case 0:
            incPxHeight(botList, -53);
            break;
    }

    console.log(`${elem.id} deleted.`);
}

function confirmDelete(event) {

    let elem = event.target.tagName == 'IMG' ? 
               event.target.parentElement : event.target;

    if (elem.className != 'botDelete') { 
        return; 
    }

    elem = elem.parentElement;

    if (elem.classList.contains('selected')) { return; }

    let msg = 'Are you sure you want to delete "' + elem.id + '"?\n' +
              'This action is irreversible!';

    createConfirmModal(msg, 
        () => { 
            deleteBot(document.getElementById(`${elem.id}`));
            clearConfirmModal(); }, 
        () => { 
            clearConfirmModal(); }
    );

}

function clearConfirmModal() {

    document.getElementById('modal').classList.add('hidden');
    document.getElementById('modalTitle').innerHTML = '';
    document.getElementById('modalMsg').innerHTML = '';
    let buttonOK = document.getElementById('buttonOK');
    let buttonCancel = document.getElementById('buttonCancel');

    buttonOK.outerHTML = buttonOK.outerHTML;
    buttonCancel.outerHTML = buttonCancel.outerHTML;
}

function createConfirmModal(msg, funOK, funCancel) {

    document.getElementById('buttonOK').addEventListener('click', funOK);
    document.getElementById('buttonCancel').addEventListener('click', funCancel);
    document.getElementById('modalTitle').innerHTML = 'Are you sure?'
    document.getElementById('modalMsg').innerHTML = msg;
    document.getElementById('modal').classList.remove('hidden');

}

function clearMsgModal() {
    document.getElementById('modal').classList.add('hidden');
    document.getElementById('modalMsg').innerHTML = '';
    let buttonOK = document.getElementById('buttonOK');
    let buttonCancel = document.getElementById('buttonCancel');

    buttonOK.outerHTML = buttonOK.outerHTML;
    buttonCancel.classList.remove('hidden');
}

function createMsgModal(msg) {
    document.getElementById('buttonOK').addEventListener('click', clearMsgModal);
    document.getElementById('buttonCancel').classList.add('hidden');
    document.getElementById('modalMsg').innerHTML = msg;
    document.getElementById('modal').classList.remove('hidden');
}

function updateBotList(bot) {
    let height = pxToNum(botList.style.height);

    botList.innerHTML += 
        `
        <div class="bot" id="${bot.name}">
            <span class="botImg"><img src="${bot.imageURL}"></span>
            <span class="botName">${bot.name}</span>
            <span class="botDelete"><img class="delImg" src="img/delete.svg"></span>
        </div>
        `;
    
    if (height >= 53*3) {
        botList.classList.add('scrollable');
    } else {
        incPxHeight(botList, 53);
    }

    console.log(`${bot.name} added to botList.`)
}

function hoverDelete(event) {
    if (selectedBot) { return; }

    let elem = event.target.tagName == 'IMG' ? 
               event.target.parentElement : event.target;

    if (elem.className != 'botDelete') { 
        return; 
    }
    
    elem.parentElement.classList.add('delete');
}

function unhoverDelete(event) {
    if (selectedBot) { return; }

    let elem = event.target.tagName == 'IMG' ? 
               event.target.parentElement : event.target;

    if (elem.className != 'botDelete') { 
        return; 
    }
    
    elem.parentElement.classList.remove('delete');
}

function pxToNum(str) {                         // changes '30px' to 30 (str -> int/float)
    return +str.slice(0, -2);
}

function incPxHeight(elem, amount) {            // increments height of elem
    let height = pxToNum(elem.style.height);
    height += amount;
    elem.style.height = height + 'px';
}

function selectBot(event) {
    let elem = event.target.tagName == 'IMG' ? 
               event.target.parentElement : event.target;

    if (elem.className == 'botDelete') { 
        return; 
    }

    elem = elem.parentElement;

    if (elem.classList.contains('selected')) {
        elem.classList.remove('selected');
        showDelete();
        selectedBot = '';
        hideProceed();
        return;
    }

    if (selectedBot) {
        let selected = document.getElementsByClassName('selected');
        selected[0].classList.remove('selected');
        showDelete();
        selectedBot = '';
    }

    elem.classList.add('selected');
    selectedBot = elem.id;
    showProceed();
    hideDelete();

}

function showDelete() {
    let selected = document.getElementById(selectedBot);
    if (!selected) { return; }
    selected = selected.lastElementChild;
    selected.classList.add('botDelete');
    selected.classList.remove('placeholder');
    selected = selected.lastElementChild;
    selected.src = 'img/delete.svg';
}

function hideDelete() {
    let selected = document.getElementById(selectedBot);
    if (!selected) { return; }
    selected = selected.lastElementChild;
    selected.classList.remove('botDelete');
    selected.classList.add('placeholder');
    selected = selected.lastElementChild;
    selected.src = 'img/deletePlaceholder.png';
}

function showProceed() {
    proceed.classList.remove('hidden');
}

function hideProceed() {
    proceed.classList.add('hidden');
}

function clickProceed() {
    console.log( window.api.toMain('set-activeBot-async', selectedBot) );
    window.location.href = 'index.html';
}

botList.addEventListener('mouseover', hoverDelete);
botList.addEventListener('mouseout', unhoverDelete);
botList.addEventListener('click', confirmDelete);
botList.addEventListener('click', selectBot)
addBot.addEventListener('submit', addNewBot);
document.getElementById('buttonProceed')
        .addEventListener('click', clickProceed);
window.addEventListener('beforeunload', () => window.api.saveConfig(cf));