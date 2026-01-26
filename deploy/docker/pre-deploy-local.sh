#!/bin/bash

echo "Copy env-docker.json to env.json"
scp -i ~/.ssh/rpg-sage-stable.pem -P 2222 ./config/env-docker.json ec2-user@localhost:/rpg-sage/bot/dev/current/config/env.json