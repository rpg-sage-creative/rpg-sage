#!/bin/bash

[ -d "./scripts" ] || cd ..

# import constants and functions
source "./scripts/inc/all.sh"

# warn if any args are missing
if [ -z "$ACT" ] || [ -z "$ENV" ] || [ -z "$PKG" ]; then
	echo "daemon.sh $ACT $ENV $PKG"
	echo "/bin/bash daemon.sh start|stop|restart|delete dev|beta|stable aws|mini|docker|local"
	exit 1
fi

if [ "$ACT" = "start" ]; then
	sshCommands=(
		"pm2 start pm2.config.cjs --env $ENV"
		"pm2 save"
	)
else
	sshCommands=(
		"pm2 $ACT sage-bot-$ENV sage-map-$ENV"
		# "pm2 $ACT sage-bot-$ENV sage-map-$ENV sage-pdf-$ENV sage-random-$ENV sage-search-$ENV"
	)

fi

if [ "$WHERE" = "local" ]; then
	eval $COMMAND
else
	sshRun "${sshCommands[@]}"
fi
