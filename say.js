const {spawn} = require('child_process');
const WebSocket = require('ws');

function say(text, voice, client) {
  console.log(`Spawning voxin with voice ${voice}`);
  const child = spawn(`voxin-say -l ${voice} "${text}" | stdbuf -o O aplay`, {shell: true});

  child.on('close', () => {
    console.log(`aplay closed`);
    const reply = {};
    reply.route = 'speech-end';
    reply.voice = voice;
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(reply));
    }
  });

  child.stdout.on("data", data => {
    console.log(data);
  });

  console.log("Sending speech start");
  const data = {};
  data.route = 'speech-start';
  data.voice = voice;
  if (client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(data));
  }
}

module.exports = { say }