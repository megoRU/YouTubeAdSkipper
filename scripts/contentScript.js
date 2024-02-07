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

// Устанавливаем интервал для периодической проверки времени
setInterval(() => {
    // Замените adStartTime и adEndTime на значения, полученные из вашего API
    checkAndFastForward("00:01:36", "00:02:00");
}, 1000); // Проверяем каждые 1 секунд