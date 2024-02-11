// contentScript.js

// Функция для преобразования времени в секунды
function timeToSeconds(timeString) {
    const [hours, minutes, seconds] = timeString.split(':');
    return parseInt(hours, 10) * 3600 + parseInt(minutes, 10) * 60 + parseInt(seconds, 10);
}

// Функция для проверки текущего времени видео и перемотки при необходимости
function checkAndFastForward(adStartTime, adEndTime) {
    const video = document.querySelector('video');

    if (video) {
        const currentTime = video.currentTime;
        const startTimeInSeconds = timeToSeconds(adStartTime);
        const endTimeInSeconds = timeToSeconds(adEndTime);
        console.log(`currentTime: ${currentTime}, startTimeInSeconds: ${startTimeInSeconds}, endTimeInSeconds: ${endTimeInSeconds}`);

        // Если текущее время видео находится в промежутке времени для перемотки, то перематываем видео
        if (currentTime >= startTimeInSeconds && currentTime <= endTimeInSeconds) {
            const remainingTime = endTimeInSeconds - currentTime;
            // Перематываем видео вперед на оставшееся время
            fastForwardVideo(remainingTime);
        }
    }
}

// Функция для перемотки видео вперед на заданное время
function fastForwardVideo(seconds) {
    const video = document.querySelector('video');

    if (video) {
        video.currentTime += seconds;
    }
}

// Отправка сообщения с запросом состояния тумблера
chrome.runtime.sendMessage({type: 'getExtensionToggleState'});

// Получение данных о рекламе для текущего видео
async function getVideoAdData() {
    // Создаем полный URL с параметрами
    const apiUrl = `https://api.megoru.ru/api/youtube/get?videoId=${getCurrentTabURL()}`;

    console.log("contentScript.js getVideoAdData: " + apiUrl);

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

function getCurrentTabURL() {
    return document.URL;
}

let globalUrl = '';
let globalAdIntervals = [];

setInterval(async () => {
    try {
        const result = await chrome.storage.local.get('extensionEnabled');
        const extensionToggle = result.extensionEnabled;
        console.log(`contentScript.js setInterval: ${extensionToggle}`);

        if (extensionToggle === 'true') {
            console.log("contentScript.js setInterval: " + globalAdIntervals.length);

            if (globalUrl !== document.URL) {
                globalAdIntervals = [];
            }

            if (globalAdIntervals.length === 0) {
                // Сохраняем промис в globalAdIntervals
                globalAdIntervals = await getVideoAdData().then(adData => {
                    if (adData !== null) {
                        // Этот код выполнится, когда промис getAdData() разрешится
                        if (adData && adData.ads) {
                            // Перебираем массив временных промежутков и выполняем действия для каждого
                            adData.ads.forEach(adInterval => {
                                // Разделяем начальное и конечное время
                                const [startTime, endTime] = adInterval.split('-');
                                console.log([startTime, endTime]);
                                console.log(startTime);
                                console.log(endTime);

                                // Замените adStartTime и adEndTime на значения из текущего промежутка
                                checkAndFastForward(startTime, endTime);
                            });
                        }
                        return adData;
                    }
                });
            } else {
                // Если данные уже есть, обрабатываем их
                const adData = await globalAdIntervals;
                if (adData !== undefined) {
                    adData.ads.forEach(adInterval => {
                        const [startTime, endTime] = adInterval.split('-');
                        console.log([startTime, endTime]);
                        console.log(startTime);
                        console.log(endTime);

                        // Замените adStartTime и adEndTime на значения из текущего промежутка
                        checkAndFastForward(startTime, endTime);
                    });
                    return adData;
                }
            }
        } else {
            console.info("Тумблер выключен");
        }
    } catch (error) {
        console.info("Произошла ошибка при получении данных:", error);
    }
}, 1000);