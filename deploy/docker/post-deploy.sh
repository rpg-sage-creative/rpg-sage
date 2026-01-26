#!/bin/bash

echo "Reinstall ./node_modules"
rm -rf node_modules
npm ci

echo "Rebuild app"
rm -rf build
npm run build

echo "Restart process"
pm2 startOrRestart bot.config.cjs --env dev --only sage-bot --updateEnv