const chromeLauncher = require('chrome-launcher');
const CDP = require('chrome-remote-interface');

/**
 * Launches a debugging instance of Chrome.
 * @param {boolean=} headless True (default) launches Chrome in headless mode.
 *     False launches a full version of Chrome.
 * @return {Promise<ChromeLauncher>}
 */
function launchChrome(headless=true, scaleFactor=0.5, width=640, height=480) {
  return chromeLauncher.launch({
    // startingUrl: 'https://localhost:3000',
    port: 1337, // Uncomment to force a specific port of your choice.
    chromeFlags: [
      `--window-size=${width},${height}`,
      '--display=:0',
      '--kiosk',
      '--incognito',
      '--window-position=0,0',
      '--disable-infobars',
      '--noerrdialogs',
      '--enable-logging=stderr --v=1 > /home/pi/chromium-error.log 2>&1',
      '--enable-speech-dispatcher',
      `--force-device-scale-factor=${scaleFactor}`,
      headless ? '--headless' : ''
    ],
  });
}

async function run() {
  const chrome = await launchChrome(false);
  const protocol = await CDP({port: chrome.port});
  const {Page, Runtime, Security, Emulation, Input} = protocol;

  await Security.setIgnoreCertificateErrors({ignore: true});
  await Page.enable();

  // await Page.navigate({url: 'chrome://settings'});
  // await Runtime.evaluate({expression: "chrome.settingsPrivate.setDefaultZoom(0.5);"});
  await Page.navigate({url: 'https://localhost:3000'});
  await Page.loadEventFired();

  for (let i = 0; i < 5; i++) {
    await Input.dispatchKeyEvent({
      type: "rawKeyDown",
      modifiers: 4,
      code: "Minus",
      text: "-",
      key: "-",
      unmodifiedText: "-",
      keyIdentifier: "Subtract",
      nativeVirtualKeyCode: 0x6D
    });
  }

  for (let i = 0; i < 5; i++) {
    await Input.dispatchKeyEvent({
      type: "rawKeyDown",
      modifiers: 2,
      code: "Minus",
      text: "-",
      key: "-",
      unmodifiedText: "-",
      keyIdentifier: "Subtract",
      nativeVirtualKeyCode: 0xFFAD
    });
  }

  await Runtime.evaluate({expression: "document.getElementById('volume_button').click();"});
}
module.exports = run;