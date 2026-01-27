#!/bin/bash

envCodeName="$1"
destCodeName="$1"

echo "Copy env-docker.json to env.json"
scp -i ~/.ssh/rpg-sage-stable.pem -P 2222 "./config/env-$envCodeName.json" "ec2-user@localhost:/home/ec2-user/legacy/$destCodeName/current/config/env.json"