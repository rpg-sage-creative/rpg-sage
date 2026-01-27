#!/bin/bash

codeName="$1"

botPath=""
if [ -d "/rpg-sage/bot/config" ]; then
	botPath="/rpg-sage/bot/config"
fi
if [ -d "/home/ec2-user/legacy/config" ]; then
	botPath="/home/ec2-user/legacy/config"
fi

echo "Copy local ./config/env-$codeName.json to remote"
eval "scp -i ~/.ssh/rpg-sage-stable.pem -P 2222 ./config/env-$codeName.json ec2-user@localhost:$botPath/env-$codeName.json"