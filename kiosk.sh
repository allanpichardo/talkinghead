#!/bin/sh
sudo killall chromium-browser
sudo killall node
export CHROME_PATH="/usr/bin/chromium-browser"
xset -dpms     # disable DPMS (Energy Star) features.
xset s off     # disable screen saver
xset s noblank # don't blank the video device
matchbox-window-manager -use_titlebar no &
unclutter &    # hide X mouse cursor unless mouse activated
sudo festival --server '(set! server_port 1515)' &
npm --prefix /home/pi/talkinghead start > /home/pi/log-file.txt 2> /home/pi/error-file.txt