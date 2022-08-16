#!/bin/bash

#region check for switches / args

WHICH=
WHERE=
while test $# -gt 0; do
	case "$1" in
		dev|beta|stable|data) WHICH="$1"; shift; ;;
		mini|remote) WHERE="$1"; shift; ;;
		*) break; ;;
	esac
done

# warn if any args are missing
if [ -z "$WHICH" ] || [ -z "$WHERE" ]; then
	echo "/bin/bash deploy.sh dev|beta|stable|data mini|remote"
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

echoAndDo "cd $sageRootDir"
echoAndDo "/bin/bash ./scripts/pre-build.sh"
echoAndDo "tsc --build tsconfig.json"
echoAndDo "/bin/bash ./scripts/post-build.sh"
if [ "$WHICH" = "data" ]; then
	echoAndDo "/bin/bash ./scripts/run-tests.sh"
fi

# set dist dir and daemon file name and dir
deployDirLocal="$sageRootDir/deploy"
deployDir="$deployDirRemote"
dataDir="$dataDirRemote"
runDir="$botDirRemote/$WHICH"
sshHost="$sshHostRemote"
if [ "$WHERE" = "mini" ]; then
	deployDir="$deployDirDev"
	dataDir="$dataDirDev"
	runDir="$botDirDev/$WHICH"
	sshHost="$sshHostDev"
fi

#region setup deploy folder, zip deployment, deploy it, and delete local deployment

echoAndDo "rm -rf $deployDirLocal; mkdir $deployDirLocal"

# build a tmp deploy folder to remove sym links before zipping
echoAndDo "mkdir $deployDirLocal/tmp; cd $deployDirLocal/tmp"
if [ "$WHICH" = "data" ]; then
	echoAndDo "echo 'ver 0.0.0' > version.txt"
	echoAndDo "echo 'ver 0.0.0' > sage-data-pf2e.ver"
	echoAndDo "cp -r $sageRootDir/data/pf2e/dist/* $deployDirLocal/tmp"
	echoAndDo "zip -rq9 $deployDirLocal/data *"

	# stage files in remote deploy folder
	echoAndDo "scp $deployDirLocal/data.zip $sshHost:$deployDir/"
else
	# echoAndDo "cp -r $sageRootDir/node_modules $deployDirLocal/tmp"
	echoAndDo "cp -r $sageRootDir/dist/sage* $deployDirLocal/tmp"
	echoAndDo "cp $sageRootDir/dist/*.mjs $deployDirLocal/tmp"
	echoAndDo "cp $sageRootDir/package.json $deployDirLocal/tmp"
	echoAndDo "zip -rq9 $deployDirLocal/bot *"

	# stage files in remote deploy folder
	echoAndDo "scp $deployDirLocal/bot.zip $sshHost:$deployDir/"
fi

# remove local deploy
echoAndDo "rm -rf $deployDirLocal"

#endregion

# return to where i started so ssh.sh runs
echoAndDo "cd $sageRootDir"

# execute the deploy script on the remote
NOW=`date '+%F-%H%M'`;
if [ "$WHICH" = "data" ]; then
	sshCommands=(
		# "zip -rq9 $dataDir/pf2e/dist-$NOW $dataDir/pf2e/dist"
		"mv $dataDir/pf2e/dist $dataDir/pf2e/dist-$NOW"
		"unzip -q $deployDir/data -d $dataDir/pf2e/dist"
		"rm -f $deployDir/data.zip"
		# "pm2 restart sage-dev"
		"pm2 restart sage-beta"
		"pm2 restart sage-stable"
	)
else
	sshCommands=(
		"pm2 delete sage-$WHICH"
		"cp -r $runDir $runDir-$NOW"
		"rm -rf $runDir && mkdir $runDir"
		"ln -s $dataDir $runDir/data"
		"unzip -q $deployDir/bot -d $runDir"
		"rm -f $deployDir/bot.zip"
		"cd $runDir"
		"mkdir node_modules"
		"npm install $CANVAS_NPM"
		"npm install $DISCORD_NPM"
		"npm install $XREGEXP_NPM"
		"npm install $PDF2JSON_NPM"
		#"echo \"declare module 'pdf2json';\" > ./node_modules/pdf2json/pdfparser.d.ts"
		"pm2 start app.mjs --name sage-$WHICH --node-args='--experimental-modules --es-module-specifier-resolution=node' -- $WHICH dist"
	)
fi
/bin/bash "$sageRootDir/scripts/ssh.sh" "$sshHost" "${sshCommands[@]}"
