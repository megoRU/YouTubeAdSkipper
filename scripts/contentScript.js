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
navigator.serviceWorker.controller.postMessage({
    type: 'extensionEnabled'
});

// Получение данных о рекламе для текущего видео
function getAdData() {
    // Создаем полный URL с параметрами
    const apiUrl = `http://localhost:8080/youtube?videoId=` + getVideoURL();

    globalUrl = getVideoURL();
    console.log("apiUrl: " + apiUrl)
    // Отправляем GET-запрос
    return fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            console.log(data);
            return data;
        })
        .catch(error => {
            console.info("Произошла ошибка при получении данных о рекламе:", error);
            return null;
        });
}


function getVideoURL() {
    return document.URL;
}

var globalUrl = '';

var globalAdIntervals = [];

setInterval(() => {
    chrome.storage.local.get('extensionEnabled').then(function(result) {
        const extensionToggle = result.extensionEnabled;
        console.log(`extensionToggle: ${extensionToggle}`);

        if (extensionToggle === 'true') {
            console.log("globalAdIntervals.length: " + globalAdIntervals.length);

            if (globalUrl !== document.URL) {
                globalAdIntervals = [];
            }

            if (globalAdIntervals.length === 0) {
                // Сохраняем промис в globalAdIntervals
                globalAdIntervals = getAdData().then(adData => {
                    // Этот код выполнится, когда промис getAdData() разрешится
                    if (adData && adData.ads) {
                        // Перебираем массив временных промежутков и выполняем действия для каждого
                        adData.ads.forEach(adInterval => {
                            // Разделяем начальное и конечное время
                            const [startTime, endTime] = adInterval.split('-');
                            console.log([startTime, endTime])
                            console.log(startTime)
                            console.log(endTime)

                            // Замените adStartTime и adEndTime на значения из текущего промежутка
                            checkAndFastForward(startTime, endTime);
                        });
                    }
                    return adData; // Передаем adData дальше
                });
            } else {
                // Если данные уже есть, обрабатываем их
                globalAdIntervals.then(adData => {
                    adData.ads.forEach(adInterval => {
                        const [startTime, endTime] = adInterval.split('-');
                        console.log([startTime, endTime])
                        console.log(startTime)
                        console.log(endTime)

                        // Замените adStartTime и adEndTime на значения из текущего промежутка
                        checkAndFastForward(startTime, endTime);
                    });
                });
            }
            // checkAndFastForward("00:01:36", "00:02:00");
        } else {
            console.info("Тумблер выключен");
        }
    }).catch(function(error) {
        console.info("Произошла ошибка при получении данных:", error);
    });
}, 1000);