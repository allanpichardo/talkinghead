const WebSocket = require('ws');
const express = require('express');
const path = require('path');
const Twit = require('twit');
const config = require('./config');
const language = require('@google-cloud/language');
const sqlite3 = require('sqlite3').verbose();

const googleClient = new language.LanguageServiceClient({
    projectId: config.google_project_id,
    keyFilename: config.google_keyfile,
});
const twitter = new Twit({
    consumer_key: config.twitter_api_key,
    consumer_secret: config.twitter_api_key_secret,
    access_token: config.twitter_access_token,
    access_token_secret: config.twitter_access_token_secret,
});

let db = new sqlite3.cached.Database('db/talkinghead.db');
const app = express();
const wss = new WebSocket.Server({port: 8080});
const port = 3000;

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

wss.on('connection', function connection(client) {
    console.log('Client connection');
    client.on('message', function (data) {
        console.log(data);
        data = JSON.parse(data);
        switch (data.route) {
            case 'discuss':
                discuss(data.text, client);
                break;
        }
    });
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

function discuss(text, client) {
    const document = {
        content: text,
        type: 'PLAIN_TEXT',
    };

    googleClient
        .analyzeEntities({document: document})
        .then(results => {
            const entities = results[0].entities;

            let topics = [];
            entities.forEach((entity) => {
                topics.push(entity.name);
            });


        })
        .catch(err => {
            console.error('ERROR:', err);
        });
}

function main() {
    let stream = twitter.stream('statuses/filter', {track: config.listen_for});

    stream.on('tweet', function (tweet) {
        broadcast('tweet', tweet);
    });
}

main();