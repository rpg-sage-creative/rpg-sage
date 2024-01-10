#!/bin/bash

# ssh connection
sshHost="ec2-user@api.rpgsage.io"
sshKey="-i '~/.ssh/rpg-sage-stable.pem'"
sshPort=""
scpPort=""

# remote
botDir="/home/ec2-user/legacy"
packageDir="$botDir/$PKG"
