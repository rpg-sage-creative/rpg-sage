#!/bin/bash

npm ci
npm run build
pm2 start bot.config.cjs --env dev --only sage-bot