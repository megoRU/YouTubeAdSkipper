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
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    console.log("chrome.runtime.onMessage.addListener updateUrl");
    const regExp = 'https:\/\/www.youtu(?:.*\/v\/|.*v\=|\.be\/)([A-Za-z0-9_\-]{11})';

    if (message.type === 'updateUrl') {
        await updateUrl(message.url, regExp);
    }

    if (message.type === 'updateData') {
        await updateData(message.data, regExp);
    }
});

async function updateUrl(url, regExp) {
    // Обновляем текст на всплывающем окне с полученным URL
    document.getElementById('urlDisplay').innerText = url;

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

async function updateData(data, regExp) {
    if (data.match(regExp)) {
        const adData = await getVerified(data);
        const verifiedElement = document.getElementById('verified');

        if (adData.ads === null && adData.verified === false) {
            const adTimes = document.getElementById("adTimes");
            const sendData = document.getElementById("sendData");

            if (adTimes !== null && sendData !== null) {
                adTimes.style.display = 'block';
                sendData.style.display = 'block';
            }
        } else if (adData.verified === true) {
            const icon = createIcon('/images/verified.png');
            verifiedElement.textContent = "Верифицированное видео ";
            verifiedElement.appendChild(icon);
        } else {
            const icon = createIcon('/images/no-verified.png');
            verifiedElement.textContent = "Не верифицировано";
            verifiedElement.appendChild(icon);
            document.getElementById("adTimes").style.display = 'block';
            document.getElementById("sendData").style.display = 'block';
        }
    } else {
        console.log("Получены данные из background.js: ", data);
    }
}

function createIcon(src) {
    const icon = document.createElement('img');
    icon.src = src;
    icon.height = 100;
    icon.width = 100;
    return icon;
}

async function getVerified(url) {
    const apiUrl = `https://api.megoru.ru/api/youtube/verified?videoId=${url}`;
    console.log("apiUrl: " + apiUrl)

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        console.log("data get: " + JSON.stringify(data));
        return data;
    } catch (error) {
        console.info("Произошла ошибка при получении данных о рекламе:", error);
        return null;
    }
}

async function saveAds(url, timeCodes) {
    const apiUrl = "https://api.megoru.ru/api/youtube/save";
    const requestOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            url: url,
            ads: timeCodes,
        }),
    };

    try {
        const response = await fetch(apiUrl, requestOptions);
        const data = await response.json();
        console.log("data post: " + JSON.stringify(data));
        return data;
    } catch (error) {
        console.error("Произошла ошибка при отправке данных о рекламе:", error);
        return null;
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const urlElement = document.getElementById('urlDisplay');
    const dev = document.getElementById('dev-input');
    const adDataInput = document.getElementById('adData');
    const sendDataButton = document.getElementById('sendData');
    const adTimes = document.getElementById('adTimes');

    sendDataButton.addEventListener('click', async function () {
        const adData = adDataInput.value;
        const jsonData = {
            times: adData,
            youtube_url: urlElement.textContent
        };

        dev.textContent = JSON.stringify(jsonData);

        adDataInput.remove();
        sendDataButton.remove();
        adTimes.remove();

        console.log("jsonData.youtube_url " + jsonData.youtube_url);

        try {
            const data = await saveAds(jsonData.youtube_url, jsonData.times);
            console.log("Данные получены:", data);
        } catch (error) {
            console.error("Произошла ошибка при получении данных о рекламе:", error);
        }
    });

    // Убедитесь, что здесь нет вызова saveAds
    loadSettings();
});