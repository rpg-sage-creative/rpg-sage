#!/bin/bash

# bring in all the config information
source "./scripts/config.sh"

# get host from first arg
sshHost="$1"
shift

# If going to dev, source the shell
sshCommand=""
if [ "$sshHost" = "$sshHostDev" ]; then
	sshCommand="source ~/.zshrc;"
fi

# combine all other args into a single command
sshCommands=("$@")
for cmd in "${sshCommands[@]}"; do
	sshCommand="$sshCommand echo \"$cmd\"; eval \"$cmd\";"
done

# include an exit
sshCommand="$sshCommand exit;"

# echo "ssh '$sshHost' '$sshCommand'"
ssh "$sshHost" "$sshCommand"
