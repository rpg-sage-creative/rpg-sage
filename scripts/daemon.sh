#!/bin/bash

#region check for switches / args

ACTION=
WHICH=
WHERE=
while test $# -gt 0; do
	case "$1" in
		start|stop|delete|restart) ACTION="$1"; shift; ;;
		dev|beta|stable) WHICH="$1"; shift; ;;
		local|mini|remote) WHERE="$1"; shift; ;;
		*) break; ;;
	esac
done

# warn if any args are missing
if [ -z "$ACTION" ] || [ -z "$WHICH" ] || [ -z "$WHERE" ]; then
	echo "/bin/bash $daemonFile {action} {which} {where}"
	exit 1
fi

#endregion

#region consts and imports

# bring in all the config information
if [ -f "./config.sh" ]; then
	source "./config.sh"
elif [ -f "./scripts/config.sh" ]; then
	source "./scripts/config.sh"
fi

#endregion

# set dist dir and daemon file name and dir
runDir="$botDirRemote/$WHICH"
if [ "$WHERE" = "local" ]; then
	runDir="$sageBotDir/dist"
elif [ "$WHERE" = "mini" ]; then
	runDir="$botDirDev/$WHICH"
fi

command="pm2 $ACTION sage-$WHICH"
if [ "$ACTION" = "start" ]; then
	command="pm2 start app.mjs --name sage-$WHICH --node-args='--experimental-modules --es-module-specifier-resolution=node' -- $WHICH dist"
fi

if [ "$WHERE" = "local" ]; then
	echoAndDo "cd $runDir"
	echoAndDo "$command"
else
	sshHost="$sshHostRemote"
	if [ "$WHERE" = "mini" ]; then
		sshHost="$sshHostDev"
	fi
	sshCommands=(
		"cd $runDir"
		"$command"
	)
	/bin/bash "$sageRootDir/scripts/ssh.sh" "$sshHost" "${sshCommands[@]}"
fi
