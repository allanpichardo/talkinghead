const { say } = require('./server.js');

console.log("Starting audio");
say("Using this comment to let folks know that you can watch Earthlings for free: I strongly encourage everyone who is turned off by this news story to learn more.", "susan-embedded-high", {readyState: 'fake'});
console.log("Done");