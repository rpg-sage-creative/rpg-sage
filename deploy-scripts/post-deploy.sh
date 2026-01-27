#!/bin/bash

codeName="$1"

echo "Reinstall ./node_modules"
rm -rf node_modules
npm ci

echo "Rebuild app"
rm -rf build
npm run build

echo "Copy ../config/env-$codeName.json to ./config/env.json"

echo "Restart process"
pm2 startOrRestart bot.config.cjs --env "$codeName" --only sage-bot --update-env
pm2 save --force