const {spawn} = require('child_process');
const WebSocket = require('ws');

function say(text, voice, client) {
  console.log(`Spawning voxin with voice ${voice}`);
  const voxin = spawn(`voxin-say -j 2 -l ${voice} "${text}" | cat`, {shell: true, });
  const aplay = spawn(`aplay`);

  voxin.on('close', () => {
    console.log(`voxin closed`);
    const reply = {};
    reply.route = 'speech-end';
    reply.voice = voice;
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(reply));
    }
  });

  voxin.stdout.on('data', data => {
    aplay.stdin.write(data);
  });

  aplay.on('close', () => {
    console.log('aplay closed');
  });

  setTimeout(() => {
    console.log("Sending speech start");
    const data = {};
    data.route = 'speech-start';
    data.voice = voice;
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  }, 2000);
}

module.exports = { say }