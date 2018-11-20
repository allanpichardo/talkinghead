let messageQueue = [];

function main() {
    let socket = new WebSocket("ws://localhost:8080");

    socket.onmessage = function(event) {
        processSocketMessage(event.data);
    };
    socket.onerror = function(error) {
        console.log(error);
    };

    initTime();
    initTicker();
}

function processSocketMessage(data) {
    data = JSON.parse(data);
    switch(data.route) {
        case 'tweet':
            handleTweetReceived(data);
            break;
    }
}

function initTime() {
    setInterval(displayDate, 1000);
    displayDate();
}

function initTicker() {
    displayNextTweet();
}

function displayNextTweet() {
    console.log("next tweet");
    let tweet = messageQueue.length > 0 ? messageQueue.shift() : null;
    let text = tweet ? tweet.text : "Start a conversation with #talkinghead on Twitter";
    let handle = tweet ? tweet.user.screen_name : null;
    $('.marquee').html(`<p>${text}</p>`);
    $('.marquee').one('animationiteration', displayNextTweet);
    toggleUsername(handle);
}

function toggleUsername(username) {
    let slider = $('.slider');
    let handle = $('#handle');
    if(username) {
        if(slider.hasClass('slider-open')) {
            slider.toggleClass('slider-open', false);
            slider.one('transitionend webkitTransitionEnd oTransitionEnd otransitionend', function() {
                handle.html(`<p>@${username}</p>`);
                $(this).toggleClass('slider-open', true);
            });
        } else {
            handle.html(`<p>@${username}</p>`);
            slider.toggleClass('slider-open', true);
        }
    } else {
        slider.toggleClass('slider-open', false);
    }
}

function displayDate() {
    let formattedTime = moment().format('MMMM Do YYYY, h:mm:ss a');
    $('.time').html(`<p>${formattedTime}</p>`);
}

function handleTweetReceived(data) {
    console.log("Queued tweet");
    messageQueue.push(data);
}
