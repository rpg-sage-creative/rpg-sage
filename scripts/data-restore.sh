#!/bin/bash

# import constants and functions
[ -f "./inc/all.sh" ] && source "./inc/all.sh" || source "./scripts/inc/all.sh"

# warn if any args are missing
if [ -z "$ENV" ] || [ "$PKG" != "data" ]; then
	echoLog "/bin/bash restore.sh data aws|docker|mini"
	exit 1
fi

read -p "Overwrite data on $ENV? ([y]es or [n]o): "
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
scpTo "$latestDir/data.zip" "$deployDirRemote/data.zip"

#endregion

# execute the deploy script on the remote
NOW=`date '+%F-%H%M'`;
packageDirTmp="$packageDir-tmp"
packageDirOld="$packageDir-$NOW"

sshCommands=(
	"mkdir $packageDirTmp"
	"unzip -q $deployDirRemote/data -d $packageDirTmp"
	"rm -f $deployDirRemote/data.zip"

	"mv $packageDir $packageDirOld"
	"mv $packageDirTmp $packageDir"

	"pm2 desc sage-dev-$ENV >/dev/null && pm2 restart sage-dev-$ENV"
	"pm2 desc sage-beta-$ENV >/dev/null && pm2 restart sage-beta-$ENV"
	"pm2 desc sage-stable-$ENV >/dev/null && pm2 restart sage-stable-$ENV"
)

sshRun "${sshCommands[@]}"
