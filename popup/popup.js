// script.js
const extensionToggle = document.getElementById('extensionToggle');

// Загрузка сохраненного состояния из chrome.storage.local
function loadSettings() {
    // Используем chrome.storage.local.get для получения данных из локального хранилища
    chrome.storage.local.get('extensionEnabled', function (result) {
        const extensionEnabled = result.extensionEnabled;
        extensionToggle.checked = extensionEnabled === 'true';
        console.log('extensionToggle.checked: ' + extensionToggle.checked);
    });
}

// Сохранение состояния в chrome.storage.local при изменении тумблера
function saveSettings() {
    // Используем chrome.storage.local.set для сохранения данных в локальное хранилище
    chrome.storage.local.set({'extensionEnabled': extensionToggle.checked ? 'true' : 'false'}, function () {
        console.log('Settings saved');
    });
}

// Обработчик изменения состояния тумблера
extensionToggle.addEventListener('change', saveSettings);

// Подписываемся на события сообщений от фонового скрипта
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'updateUrl') {
        // Обновляем текст на всплывающем окне с полученным URL
        document.getElementById('urlDisplay').innerText = message.url;
    }

    const urlElement = document.getElementById('urlDisplay');
    let urlReplaced = urlElement.textContent.replaceAll("Ссылка: ", "");
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/gi;

    if (!urlReplaced.match(regExp)) {
        const adDataInput = document.getElementById('adData');
        const sendDataButton = document.getElementById('sendData');
        const adTimes = document.getElementById('adTimes');
        adTimes.remove()
        sendDataButton.remove()
        adDataInput.remove()
    }
});

// Опционально: отправляем запрос на получение текущего URL при открытии popup
chrome.runtime.sendMessage({type: 'requestUrl'});

document.addEventListener('DOMContentLoaded', function () {
    const urlElement = document.getElementById('urlDisplay');
    const dev = document.getElementById('dev-input');
    const adDataInput = document.getElementById('adData');
    const sendDataButton = document.getElementById('sendData');
    const adTimes = document.getElementById('adTimes');

    sendDataButton.addEventListener('click', function () {
        const adData = adDataInput.value;
        const jsonData = {
            times: adData,
            youtube_url: urlElement.textContent
        };

        // Преобразуем объект в JSON
        // Используем textContent для отображения JSON-строки

        dev.textContent = JSON.stringify(jsonData);

        adDataInput.remove()
        sendDataButton.remove()
        adTimes.remove()
    });
    loadSettings();
});