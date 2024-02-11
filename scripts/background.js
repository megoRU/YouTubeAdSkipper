// background.js

chrome.runtime.onInstalled.addListener(onInstalledHandler);
chrome.runtime.onUpdateAvailable.addListener(onUpdateAvailableHandler);
chrome.runtime.onMessage.addListener(onMessageHandler);
self.addEventListener('message', onSelfMessageHandler);

async function onInstalledHandler(details) {
    console.log('background.js onInstalledHandler' + details);
    if (details.reason === 'install') {
        await setExtensionEnabled(false);
        console.log('Settings installed');
        console.log('Extension installed');
    } else if (details.reason === 'update') {
        console.log('Extension updated');
        chrome.tabs.create({url: '/popup/popup.html'});
    }
}

function onUpdateAvailableHandler(details) {
    console.log('background.js onUpdateAvailableHandler' + details);
}

async function onMessageHandler(message, sender, sendResponse) {
    console.log("background.js onMessageHandler: " + message)
    if (message.type === 'requestUrl') {
        await sendCurrentTabUrl('updateUrl');
    }
    if (message.type === 'verified') {
        await sendCurrentTabUrl('updateData');
    }
}

async function sendCurrentTabUrl(messageType) {
    const currentTab = await getCurrentTab();
    if (currentTab) {
        console.log(`background.js sendCurrentTabUrl: ${currentTab.url}`);
        chrome.runtime.sendMessage({type: messageType, data: currentTab.url});
    } else {
        console.info(`Нет активной вкладки для отправки сообщения '${messageType}'`);
    }
}

function onSelfMessageHandler(event) {
    console.log('background.js onSelfMessageHandler: ' + event);

    if (event.data.type === 'getExtensionToggleState') {
        const extensionToggleState = localStorage.getItem('extensionEnabled');
        event.source.postMessage({
            type: 'extensionToggle',
            value: extensionToggleState
        });
    }
}

async function setExtensionEnabled(value) {
    return new Promise(resolve => {
        chrome.storage.local.set({'extensionEnabled': value.toString()}, resolve);
    });
}

async function getCurrentTab() {
    return new Promise(resolve => {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            resolve(tabs[0]);
        });
    });
}

// self.addEventListener('fetch', function (event) {
//     console.log('fetch: ' + event.returnValue)
// });