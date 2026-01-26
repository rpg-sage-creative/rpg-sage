#!/bin/bash

scp -i ~/.ssh/rpg-sage-stable.pem ./config/env-docker.json ec2-user@localhost:2222:/rpg-sage/dev/current/config/env.json