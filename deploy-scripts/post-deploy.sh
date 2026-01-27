#!/bin/bash

envCodeName="$1"

echo "Reinstall ./node_modules"
rm -rf node_modules
npm ci

echo "Rebuild app"
rm -rf build
npm run build

echo "Restart process"
pm2 startOrRestart bot.config.cjs --env "$envCodeName" --only sage-bot --update-env
pm2 save --force