const WebSocket = require('ws');
const express = require('express');
const fs = require('fs');
const https = require('https');
const path = require('path');
const Twit = require('twit');
const config = require('./config.json');
const language = require('@google-cloud/language');
const sqlite3 = require('sqlite3').verbose();
const run = require('./run');
const { exec } = require('child_process');

const httpsOptions = {
    key: fs.readFileSync(config.keyfile_path, 'utf8'),
    cert: fs.readFileSync(config.certificate_path, 'utf8')
};

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
const server = https.createServer(httpsOptions, app);
const wss = new WebSocket.Server({
    server
});
const port = 3000;

app.use(express.static('public', { dotfiles: 'allow' }));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

wss.on('connection', function connection(client) {
    console.log('Client connection');
    client.on('message', function (data) {
        data = JSON.parse(data);
        switch (data.route) {
            case 'discuss':
                discuss(data.text, client);
                break;
            case 'say':
                say(data.text, data.voice, client);
                break;
        }
    });
});


// app.listen(port, () => console.log(`Talkinghead server listening on port ${port}!`));
server.listen(port, () => {
    console.log(`Talkinghead secure server listening on port ${port}!`);
    console.log(`Starting Festival TTS in server mode`)
    exec('festival --server', ((error, stdout, stderr) => {
        if(error) {
            console.error(error);
            process.exit(1);
        } else if(stderr) {
            console.error(stderr);
            process.exit(1);
        } else {
            console.log('Festival server started');
            console.log(stdout);
            console.log('Starting kiosk.');
            run().then(() => {
                console.log('Kiosk started.');
            }).catch(e => {
                console.error(e);
                process.exit(1);
            });
        }
    }));
});

function say(text, voice, client) {
    exec(`voxin-say -l ${voice} "${text}" | aplay`, ((error, stdout) => {
        reply = {};
        reply.route = 'speech-end';
        reply.voice = voice;
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(reply));
        }
    }));
}

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
            let query = "select * from comments_search where ";
            entities.forEach((entity, i) => {
                query += (i === entities.length - 1) ? "parent match ? " : "parent match ? or ";
                topics.push(`${entity.name}`);
            });
            query += "order by random() limit 1";
            console.log(query);
            console.log(topics);

            db.get(query, topics, function(err, row) {
                if(err) {
                    console.log(err);
                }else if(row){
                    console.log(row);
                    row.route = 'dialogue';
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify(row));
                    }
                }
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
