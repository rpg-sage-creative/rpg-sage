#!/bin/bash

echo "Copy env-docker.json to env.json"
scp -i ~/.ssh/rpg-sage-stable.pem -P 2222 ./config/env-dev.json ec2-user@localhost:/home/ec2-user/legacy/dev/current/config/env.json