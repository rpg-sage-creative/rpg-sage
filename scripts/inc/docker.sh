#!/bin/bash

# ssh connection
sshHost="ec2-user@localhost"
sshKey="-i '~/.ssh/rpg-sage-docker'"
sshPort="-p 2022"
scpPort="-P 2022"

# docker image
dockerImage="rpg-sage-local"

# remote
botDir="/home/ec2-user/legacy"
packageDir="$botDir/$PKG"
