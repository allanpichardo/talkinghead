const WebSocket = require('ws');
const express = require('express');
const path = require('path');
const Twit = require('twit');
const config = require('./config');

const app = express();
const wss = new WebSocket.Server({ port: 8080 });
const twitter = new Twit({
    consumer_key: config.twitter_api_key,
    consumer_secret: config.twitter_api_key_secret,
    access_token: config.twitter_access_token,
    access_token_secret: config.twitter_access_token_secret,
});
const port = 3000;

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

wss.on('connection', function connection(client) {
    console.log('Client connection');
});

app.listen(port, () => console.log(`Talkinghead server listening on port ${port}!`));

function broadcast(route, data) {
    data.route = route;
    data = JSON.stringify(data);
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
}

function initiateTwitterStream() {
    let stream = twitter.stream('statuses/filter', { track: config.listen_for });

    stream.on('tweet', function (tweet) {
        broadcast('tweet', tweet);
    })
}

initiateTwitterStream();