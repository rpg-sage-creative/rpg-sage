#!/bin/bash

[ -d "./scripts" ] || cd ..

# import constants and functions
source "./scripts/inc/all.sh"

# warn if any args are missing
if [ -z "$ENV" ] || [ -z "$PKG" ] || [ "$PKG" = "maps" ]; then
	echo "deploy.sh $ENV $PKG"
	echoLog "/bin/bash deploy.sh dev|beta|stable aws|mini|docker|local"
	exit 1
fi

NOW=`date '+%F-%H%M'`;

packageDirTmp="$packageDir-tmp"
packageDirOld="$packageDir-$NOW"
sshCommands=(
	"cd $botDir"
	"git clone git@github.com:randaltmeyer/rpg-sage-legacy.git $packageDirTmp"
	"cd $packageDirTmp"
	"npm install"
	"npm run build"
	"npm run daemon delete $ENV"
	"cd .."
	"mv $packageDir $packageDirOld"
	"mv $packageDirTmp $packageDir"
	"cd $packageDir"
	"npm run daemon start $ENV"
)
sshRun "${sshCommands[@]}"
