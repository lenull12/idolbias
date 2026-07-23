#!/bin/bash
cd /home/raphi/idolbias
/mnt/c/Program\ Files/nodejs/node.exe node_modules/wrangler/wrangler.js d1 execute idolbias-db --file=drizzle/0000_flaky_mac_gargan.sql --remote 2>&1
