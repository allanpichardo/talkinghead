const {spawn} = require('child_process');
const WebSocket = require('ws');

function say(text, voice, client) {
  console.log(`Spawning voxin with voice ${voice}`);
  const child = spawn(`voxin-say -l ${voice} "${text}" | aplay`, {shell: true});
  child.stdout.on('data', data => {
    console.log(`Voxin is ouptutting data`);
    const reply = {};
    reply.route = 'speech-start';
    reply.voice = voice;
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(reply));
    }
  });

  child.on('close', () => {
    console.log(`aplay closed`);
    const reply = {};
    reply.route = 'speech-end';
    reply.voice = voice;
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(reply));
    }
  });
}

module.exports = { say }