chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason === 'install') {
        chrome.storage.local.set({'extensionEnabled': 'false'}, function () {
            console.log('Settings installed');
        });
        console.log('Extension installed');
    } else if (details.reason === 'update') {
        console.log('Extension updated');
        chrome.tabs.create({ url: '/popup/popup.html' });
    }
});

// Обработчик события доступности обновления расширения
chrome.runtime.onUpdateAvailable.addListener(function (details) {
    console.log('Update available');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("chrome.runtime.onMessage.addListener message: " + message)
    if (message.type === 'requestUrl') {
        // Получаем активную вкладку и отправляем URL в popup.js
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            const currentTab = tabs[0];
            if (currentTab) {
                chrome.runtime.sendMessage({type: 'updateUrl', url: "Ссылка: " + currentTab.url});
            } else {
                console.info("Нет активной вкладки для отправки сообщения 'updateUrl'");
            }
        });
    }
    if (message.type === 'verified') {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            const currentTab = tabs[0];
            if (currentTab) {
                console.log("Пришли данные из метода:", currentTab.url);
                chrome.runtime.sendMessage({ type: 'updateData', data: currentTab.url });
            } else {
                console.info("Нет активной вкладки для отправки сообщения 'updateData'");
            }
        });
    }
});

self.addEventListener('message', function (event) {
    console.log('self.addEventListener message: ' + event)

    if (event.data.type === 'getExtensionToggleState') {
        const extensionToggleState = localStorage.getItem('extensionEnabled');
        event.source.postMessage({
            type: 'extensionToggle',
            value: extensionToggleState
        });
    }
});

self.addEventListener('fetch', function (event) {
    console.log('fetch: ' + event.returnValue)
});