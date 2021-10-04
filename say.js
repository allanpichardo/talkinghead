const {spawn} = require('child_process');
const WebSocket = require('ws');

function say(text, voice, client) {
  const voxin = spawn(`voxin-say`, ['-l', voice, `"${text}"`]);

  voxin.stdout.on('data', data => {
    const aplay = spawn('aplay');
    aplay.stdin.write(data);
    aplay.on('close', () => {
      const reply = {};
      reply.route = 'speech-end';
      reply.voice = voice;
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(reply));
      }
    });

    const reply = {};
    reply.route = 'speech-start';
    reply.voice = voice;
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(reply));
    }
  });
}

module.exports = { say }