#!/bin/bash

# ssh connection
sshHost="ec2-user@api.rpgsage.io"
sshKey="-i '~/.ssh/rpg-sage-stable.pem'"

# remote
botDir="/home/ec2-user/bot"
packageDir="$botDir/$PKG"
