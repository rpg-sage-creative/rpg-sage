#!/bin/bash

codeName="$1"

botPath="/home/ec2-user/legacy/config"
if [ "$coeName" = "docker" ]; then
	botPath="/rpg-sage/bot/config"
fi

echo "Copy local ./config/env-$codeName.json to remote"
eval "scp -i ~/.ssh/rpg-sage-stable.pem -P 2222 ./config/env-$codeName.json ec2-user@localhost:$botPath/env-$codeName.json"