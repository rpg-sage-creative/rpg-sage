#!/bin/bash

#region consts and imports

# bring in all the config information
if [ -f "./config.sh" ]; then
	source "./config.sh"
elif [ -f "./scripts/config.sh" ]; then
	source "./scripts/config.sh"
fi

#endregion

echoAndDo "cd $sageRootDir"
echoAndDo "/bin/bash ./scripts/pre-build.sh"
echoAndDo "tsc --build tsconfig.json"
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
	if [ ! -d $sageDataDir/$sageDataSub ]; then
		echoAndDo "mkdir $sageDataDir/$sageDataSub"
	fi
done

# ensure we have schema.json files
# if [ ! -f $sageBotDir/sage/schema.json ]; then echoAndDo "cd $sageBotDir; /bin/bash schema.sh"; fi

# start the bot
cd "$sageRootDir/dist"
node --es-module-specifier-resolution=node app.mjs dev
