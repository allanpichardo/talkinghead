#!/bin/sh
sudo killall chromium-browser
export CHROME_PATH="/usr/bin/chromium-browser"
xset -dpms     # disable DPMS (Energy Star) features.
xset s off     # disable screen saver
xset s noblank # don't blank the video device
matchbox-window-manager -use_titlebar no &
unclutter &    # hide X mouse cursor unless mouse activated
npm --prefix /home/pi/talkinhead start &