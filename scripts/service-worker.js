chrome.runtime.onInstalled.addListener(function(details) {
    if (details.reason === 'install') {
        chrome.storage.local.set({ 'extensionEnabled': 'false' }, function() {
            console.log('Settings installed');
        });
        console.log('Extension installed');
    } else if (details.reason === 'update') {
        console.log('Extension updated');
    }
});

// Обработчик события доступности обновления расширения
chrome.runtime.onUpdateAvailable.addListener(function(details) {

    console.log('Update available');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // 2. A page requested user data, respond with a copy of `user`
    if (message === 'extensionEnabled') {
        const extensionToggleState = chrome.storage.local.get('extensionEnabled');
        sendResponse();
    }
});


//URL проброс
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    console.log('Tab', changeInfo.url);
    if (changeInfo.url) {
        console.log('Tab URL Updated:', changeInfo.url);
        // Вы можете передать URL в вашу popup-страницу или в content script
        chrome.runtime.sendMessage({ type: 'updateUrl', url: changeInfo.url });
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'requestUrl') {
        // Получаем активную вкладку и отправляем URL в popup.js
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const currentTab = tabs[0];
            if (currentTab) {
                chrome.runtime.sendMessage({ type: 'updateUrl', url: "Ссылка: " + currentTab.url });
            }
        });
    }
});
//


self.addEventListener('message', function(event) {
    console.log('message: ' + event)

    if (event.data.type === 'getExtensionToggleState') {
        const extensionToggleState = localStorage.getItem('extensionEnabled');
        event.source.postMessage({
            type: 'extensionToggle',
            value: extensionToggleState
        });
    }
});

self.addEventListener('fetch', function(event) {
    console.log('fetch: ' + event.returnValue)
});