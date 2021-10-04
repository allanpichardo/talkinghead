const {spawn} = require('child_process');
const WebSocket = require('ws');

function say(text, voice, client) {
  console.log(`Spawning voxin with voice ${voice}`);
  let dataReceived = false;
  const voxin = spawn(`voxin-say -l ${voice} "${text}" | cat`, {shell: true, });
  const aplay = spawn(`aplay`);

  voxin.on('exit', (code) => {
    if(dataReceived) {
      console.log(`voxin closed`);
      console.log("Sending speech start");
      const data = {};
      data.route = 'speech-start';
      data.voice = voice;
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    } else {
      console.log(`an error occurred`);
      const data = {};
      data.route = 'error';
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    }
  });

  voxin.stdout.on('data', data => {
    dataReceived = true;
    console.log('voxin > aplay data received...');
    aplay.stdin.write(data);
  });

  aplay.on('close', () => {
    console.log('aplay closed');
    console.log('send speech end');
    const reply = {};
    reply.route = 'speech-end';
    reply.voice = voice;
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(reply));
    }
  });

}

module.exports = { say }