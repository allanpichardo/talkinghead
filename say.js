const {spawn} = require('child_process');
const WebSocket = require('ws');

function say(text, voice, client) {
  console.log(`Spawning voxin with voice ${voice}`);
  const voxin = spawn(`voxin-say`, ['-l', voice, `"${text}"`]);
  voxin.stdout.on('data', data => {
    console.log(`Voxin is ouptutting data`);
    console.log(`Spawning aplay`);
    const aplay = spawn('aplay');

    console.log(`Writing data`);
    aplay.stdin.write(data);
    aplay.on('close', () => {
      console.log(`aplay closed`);

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