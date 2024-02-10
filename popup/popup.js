// script.js
const extensionToggle = document.getElementById('extensionToggle');

// Опционально: отправляем запрос на получение текущего URL при открытии popup
chrome.runtime.sendMessage({type: 'requestUrl'});

chrome.runtime.sendMessage({type: 'verified'});

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
    console.log("chrome.runtime.onMessage.addListener updateUrl");
    const regExp = 'https:\/\/www.youtu(?:.*\/v\/|.*v\=|\.be\/)([A-Za-z0-9_\-]{11})';

    if (message.type === 'updateUrl') {
        // Обновляем текст на всплывающем окне с полученным URL
        document.getElementById('urlDisplay').innerText = message.url;

        const urlElement = document.getElementById('urlDisplay');
        let urlReplaced = urlElement.textContent.replaceAll("Ссылка: ", "");

        if (!urlReplaced.match(regExp)) {
            const adDataInput = document.getElementById('adData');
            const sendDataButton = document.getElementById('sendData');
            const adTimes = document.getElementById('adTimes');
            if (adTimes !== null && adDataInput !== null && sendDataButton !== null) {
                adTimes.remove();
                sendDataButton.remove();
                adDataInput.remove();
                console.log("Удаляем все");
            }
        } else {
            console.log("Ничего не удаляем");
        }
    }

    if (message.type === 'updateData') {
        if (message.data.match(regExp)) {
            getVerified(message.data).then(adData => {
                const verified = adData.verified;

                if (verified === true) {
                    const verifiedes = document.getElementById('verified');

                    const icon = document.createElement('img');
                    icon.src = '/images/verified.png'; // Укажите путь к вашей иконке
                    icon.height = 100;
                    icon.width = 100;

                    verifiedes.textContent = "Верифицированное видео ";

                    verifiedes.appendChild(icon);
                } else {
                    const verifiedElement = document.getElementById('verified');

                    const icon = document.createElement('img');
                    icon.src = '/images/no-verified.png'; // Укажите путь к вашей иконке
                    icon.height = 100;
                    icon.width = 100;

                    verifiedElement.textContent = "Не верифицировано";
                    verifiedElement.appendChild(icon);

                    document.getElementById("adTimes").style.display = 'block';
                    document.getElementById("sendData").style.display = 'block';
                }
            });
        }
        console.log("Получены данные из background.js: ", message);
    }
});


function getVerified(url) {
    // Создаем полный URL с параметрами
    const apiUrl = `http://localhost:8080/api/verified?videoId=` + url;

    console.log("apiUrl: " + apiUrl)
    // Отправляем GET-запрос
    return fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            console.log("data get: " + JSON.stringify(data));
            return data;
        })
        .catch(error => {
            console.info("Произошла ошибка при получении данных о рекламе:", error);
            return null;
        });
}

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