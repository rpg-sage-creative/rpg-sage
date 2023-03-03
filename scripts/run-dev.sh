#!/bin/bash

# import constants and functions
[ -f "./inc/all.sh" ] && source "./inc/all.sh" || source "./scripts/inc/all.sh"

BUILD=
FULL=
while test $# -gt 0; do
	case "$1" in
		-b) BUILD=true; shift; ;;
		-f) FULL=true; shift; ;;
		*) break; ;;
	esac
done

if [ "$FULL" = "true" ]; then
	echoAndDo "/bin/bash ./scripts/pre-build.sh"
fi
if [ "$FULL" = "true" ] || [ "$BUILD" = "true" ]; then
	echoAndDo "/bin/bash ./scripts/build.sh"
fi
if [ "$FULL" = "true" ]; then
	echoAndDo "/bin/bash ./scripts/post-build.sh"
	echoAndDo "/bin/bash ./scripts/run-tests.sh"

	sageDataDir="$sageRootDir/dist/data/sage"

	if [ ! -d "$sageDataDir/bots" ]; then
		echo "$sageDataDir/bots folder not found!"
		exit 1
	fi

	# make sure we have the sage data sub folders
	sageDataSubs=( "backup" "dice" "games" "logs" "logs/dev" "logs/beta" "logs/stable" "messages" "servers" "users" )
	for sageDataSub in "${sageDataSubs[@]}"; do
		echoAndDo "mkdir -p $sageDataDir/$sageDataSub"
	done
fi

# ensure we have schema.json files
# if [ ! -f $sageBotDir/sage/schema.json ]; then echoAndDo "cd $sageBotDir; /bin/bash schema.sh"; fi

# start the bot
echoAndDo "cd $sageRootDir/dist"
echoAndDo "node --es-module-specifier-resolution=node app.mjs dev"
