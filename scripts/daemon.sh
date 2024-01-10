#!/bin/bash

[ -d "./scripts" ] || cd ..

# start stop restart delete
ACT="$1"

# warn if any args are missing
if [ -z "$ACT" ]; then
	echo "/bin/bash daemon.sh start|stop|restart|delete aws|mini|docker|local dev|beta|stable"
	exit 1
fi

# dev beta stable
ENV="$2"
if [ -z "$ENV" ]; then ENV="dev"; fi

WHERE="$3"
if [ -z "$WHERE" ]; then WHERE="local"; fi

COMMAND=
if [ "$ACT" = "start" ]; then
	COMMAND="pm2 start pm2.config.cjs --env $ENV"

else
	COMMAND="pm2 $ACT sage-bot-$ENV sage-map-$ENV sage-pdf-$ENV sage-random-$ENV sage-search-$ENV"

fi

if [ "$WHERE" = "local" ]; then
	eval $COMMAND
fi
