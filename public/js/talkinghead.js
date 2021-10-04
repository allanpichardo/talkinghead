let messageQueue = [];
let dialogueQueue = [];
let socket;
let canInterrupt = true;
let left;
let right;
let volume = 0;
let isSpeaking = false;
let next = "";

const VOICE_FEMALE = "susan-embedded-high";
const VOICE_MALE = "nathan-embedded-high";

function main() {
    socket = new WebSocket(`wss://${self.location.hostname}:3000`);
    console.log(self.location);

    socket.onmessage = function(event) {
        processSocketMessage(event.data);
    };
    socket.onerror = function(error) {
        console.log(error);
    };

    $('#volume_button').click(handleVolumeClick);

    initTime();
    initTicker();
}

function handleVolumeClick() {
    if(volume > 0) {
        setVolume(0);
        $(this).html('<i class="material-icons">volume_off</i>');
        if(synthesizer.speaking) {
            synthesizer.pause();
        }
    } else {
        setVolume(1);
        $(this).html('<i class="material-icons">volume_up</i>');
        if(synthesizer.speaking) {
            synthesizer.resume();
        }
    }
}

function setVolume(vol) {
    volume = vol;
    if(left) {
        left.volume = vol;
    }
    if(right) {
        right.volume = vol;
    }
}

function handleFemaleSpeechEnd() {
    toggleTalkingAnimation(woman, false);
    say(next, VOICE_MALE);
    toggleTalkingAnimation(man, true);
}

function handleMaleSpeechEnd() {
    startConversation();
    toggleTalkingAnimation(man, false);
}

function say(text, voice) {
    let data = {
        route: 'say',
        text: text,
        voice: voice
    };
    isSpeaking = true;
    socket.send(JSON.stringify(data));
}

function startConversation() {
    let woman = $('.woman');
    let man = $('.man');
    if(!isSpeaking && dialogueQueue.length > 0 && volume > 0) {
        let conversation = dialogueQueue.shift();
        next = conversation.comment;
        say(conversation.parent, VOICE_FEMALE);
        toggleTalkingAnimation(woman, true);
    }
}

function toggleTalkingAnimation(on, isTalking) {
    on.toggleClass('animate_blink', !isTalking);
    on.toggleClass('animate_talk', isTalking);
}

function handleDialogueReceived(data) {
    dialogueQueue.push(data);
    startConversation();
}

function handleSpeechEndReceived(data) {
    isSpeaking = false;
    switch (data.voice) {
        case VOICE_FEMALE:
            handleFemaleSpeechEnd();
            break;
        case VOICE_MALE:
            handleMaleSpeechEnd();
            break;
    }
}

function processSocketMessage(data) {
    data = JSON.parse(data);
    switch(data.route) {
        case 'tweet':
            handleTweetReceived(data);
            break;
        case 'dialogue':
            handleDialogueReceived(data);
            break;
        case 'speech-end':
            handleSpeechEndReceived(data);
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
    let marquee = $('.marquee');
    let tweet = messageQueue.length > 0 ? messageQueue.shift() : null;
    let text = tweet ? tweet.text : "Start a conversation with #talkinghead on Twitter";
    let handle = tweet ? tweet.user.screen_name : null;
    marquee.html(`<p>${text}</p>`);
    marquee.one('animationiteration', displayNextTweet);
    toggleUsername(handle);
    if(handle) {
        canInterrupt = false;
        requestConversation(text);
    } else {
        canInterrupt = true;
    }
}

function requestConversation(text) {
    text = text.replace(/(@[^ ]+)/g, '').
                replace(/(#[^ ]+)/g, '').
                replace(/(https?:\/\/[^ ]+)/g, '').
                replace(/(RT)/g, '').
                replace(/(-)/g, '').
                trim();
    if(text) {
        let data = {
            route: 'discuss',
            text: text
        };
        socket.send(JSON.stringify(data));
    }
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
    messageQueue.push(data);
    if(canInterrupt) {
        console.log("interrupt");
        displayNextTweet();
    }
}
