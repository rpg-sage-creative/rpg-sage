#!/bin/bash

codeName="$1"
envCodeName="$codeName"
if [ "$codeName" = "docker" ]; then
	envCodeName="$dev"
fi

echo "Reinstall ./node_modules"
rm -rf node_modules
npm ci

echo "Rebuild app"
rm -rf build
npm run build

echo "Copy ../../config/env-$codeName.json to ./config/env.json"
eval "cp ../../config/env-$codeName.json ./config/env.json"

echo "Restart process"
pm2 startOrRestart bot.config.cjs --env "$envCodeName" --only sage-bot --update-env
pm2 save --force