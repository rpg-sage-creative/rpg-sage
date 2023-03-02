#!/bin/bash

# import constants and functions
[ -f "./inc/all.sh" ] && source "./inc/all.sh" || source "./scripts/inc/all.sh"

# warn if any args are missing
if [ -z "$ENV" ] || [ -z "$PKG" ]; then
	echoLog "/bin/bash restore.sh dev|beta|stable|data aws"
	exit 1
fi

read -p "Overwrite $PKG on $ENV? ([y]es or [n]o): "
case $(echo $REPLY | tr '[A-Z]' '[a-z]') in
	y|yes) ;;
	*) echoLog "K THX BYE!"; exit; ;;
esac

read -p "Are you positive? No going back now! ([y]es or [n]o): "
case $(echo $REPLY | tr '[A-Z]' '[a-z]') in
	y|yes) ;;
	*) echoLog "K THX BYE!"; exit; ;;
esac

# other dir vars
deployDirRemote="$botDir/deploy"
latestDir="$backupDir/latest"

#region setup deploy folder, zip deployment, deploy it, and delete local deployment

# stage files in remote deploy folder
scpTo "$latestDir/$PKG.zip" "$deployDirRemote/$PKG.zip"

#endregion

# execute the deploy script on the remote
NOW=`date '+%F-%H%M'`;
packageDirTmp="$packageDir-tmp"
packageDirOld="$packageDir-$NOW"
if [ "$PKG" = "data" ]; then
	sshCommands=(
		"mkdir $packageDirTmp"
		"unzip -q $deployDirRemote/$PKG -d $packageDirTmp"
		"rm -f $deployDirRemote/$PKG.zip"

		"mv $packageDir $packageDirOld"
		"mv $packageDirTmp $packageDir"

		"pm2 desc sage-dev-$ENV >/dev/null && pm2 restart sage-dev-$ENV"
		"pm2 desc sage-beta-$ENV >/dev/null && pm2 restart sage-beta-$ENV"
		"pm2 desc sage-stable-$ENV >/dev/null && pm2 restart sage-stable-$ENV"
	)
else
	sshCommands=(
		"mkdir $packageDirTmp"
		"unzip -q $deployDirRemote/$PKG -d $packageDirTmp"
		"rm -f $deployDirRemote/$PKG.zip"

		"ln -s $botDir/data $packageDirTmp/data"
		"cd $packageDirTmp"
		"npm install"
		"pm2 delete sage-$PKG-$ENV"

		"mv $packageDir $packageDirOld"
		"mv $packageDirTmp $packageDir"

		"cd $packageDir"
		"pm2 start app.mjs --name sage-$PKG-$ENV --node-args='--experimental-modules --es-module-specifier-resolution=node' -- $PKG dist"
		"pm2 save"
	)
fi
sshRun "${sshCommands[@]}"
