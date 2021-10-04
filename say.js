const {spawn} = require('child_process');
const WebSocket = require('ws');

function say(text, voice, client) {
  console.log(`Spawning voxin with voice ${voice}`);
  const voxin = spawn(`voxin-say -j 2 -l ${voice} "${text}" | cat`, {shell: true, });
  const aplay = spawn(`aplay`);

  voxin.on('close', () => {
    console.log(`voxin closed`);
    console.log("Sending speech start");
    const data = {};
    data.route = 'speech-start';
    data.voice = voice;
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });

  voxin.stdout.on('data', data => {
    aplay.stdin.write(data);
  });

  aplay.on('close', () => {
    console.log('aplay closed');
    const reply = {};
    reply.route = 'speech-end';
    reply.voice = voice;
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(reply));
    }
  });

}

module.exports = { say }