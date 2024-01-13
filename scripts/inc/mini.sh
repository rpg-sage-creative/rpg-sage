#!/bin/bash

# ssh connection
sshHost="ec2-user@Ladnar-Mini.local"
sshKey="-i '~/.ssh/rpg-sage-mini'"
sshPort="-p 2022"
scpPort="-P 2022"

# docker image
dockerImage="rpg-sage-mini"

# remote
botDir="/home/ec2-user/legacy"
packageDir="$botDir/$PKG"
