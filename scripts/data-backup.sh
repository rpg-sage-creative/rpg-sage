#!/bin/bash

# import constants and functions
[ -f "./all.sh" ] && source "./all.sh";
[ -f "./inc/all.sh" ] && source "./inc/all.sh";
[ -f "./scripts/inc/all.sh" ] && source "./scripts/inc/all.sh";

# warn if any args are missing
if [ "$ENV" != "aws" ]; then
	echo "/bin/bash data-backup.sh aws"
	exit 1
fi

TODAY=`date '+%F'`;
eval "cd $backupDir/latest"
if [ -f "./$TODAY" ] && [ "$1" != "force" ]; then
	echo "Today's backup exists ..."
	echo "/bin/bash data-backup.sh aws force"
	exit 1
fi

THIS_HOUR=`date '+%F-%H'`;
eval "cd $backupDir/latest"
if [ -f "./$THIS_HOUR" ] && [ "$2" != "force" ]; then
	echo "This hour's backup exists ..."
	echo "/bin/bash data-backup.sh aws force force"
	exit 1
fi

#region setup local backup folder and sym link it

NOW=`date '+%F-%H%M'`;

echoAndDo "cd $backupDir"
echoAndDo "rm -f ./latest"
echoAndDo "mkdir -p $NOW-$ENV"
echoAndDo "touch $NOW-$ENV/$TODAY"
echoAndDo "touch $NOW-$ENV/$THIS_HOUR"
echoAndDo "ln -s ./$NOW-$ENV ./latest"

#endregion

#region zip remote contents

# other dir vars
deployDirRemote="$botDir/deploy"
logDirRemote="$botDir/data/sage/logs"

function zipAndCopy() {
	objType="$1"

	# zip data
	sshCommands=(
		# remove old data.tar.gz
		"rm -f $deployDirRemote/$objType.tar.gz"
		# move to data folder
		"cd $botDir/data/sage/$objType"
		# create manifest
		"find . -name '*.json' -print >./$objType.manifest"
		# tar files
		"tar -czf $deployDirRemote/$objType.tar.gz --files-from ./$objType.manifest"
		# remove manifest
		"rm -rf ./$objType.manifest"
	)
	sshRun "${sshCommands[@]}"

	# copy data
	scpFrom "$deployDirRemote/$objType.tar.gz" "$backupDir/latest/$objType.tar.gz"

	# delete remote
	sshCommands=(
		"rm -f $deployDirRemote/$objType.tar.gz"
	)
	sshRun "${sshCommands[@]}"
}

zipAndCopy "bots"
zipAndCopy "dice"
zipAndCopy "e20"
zipAndCopy "games"
zipAndCopy "logs"
zipAndCopy "maps"
zipAndCopy "messages"
zipAndCopy "pb2e"
zipAndCopy "servers"
zipAndCopy "users"

# execute the deploy script on the remote
sshCommands=(
	# remove old stable-backup, create new stable-backup, then trim stable logs
	"cd $botDir/stable"
	"git rev-parse HEAD > $deployDirRemote/stable.txt"
	"git show --oneline -s >> $deployDirRemote/stable.txt"
	"find ./logs -mtime +30 -name '*.log' -delete"

	# remove old beta-backup, create new beta-backup, then trim beta logs
	"cd $botDir/beta"
	"git rev-parse HEAD > $deployDirRemote/beta.txt"
	"git show --oneline -s >> $deployDirRemote/beta.txt"
	"find ./logs -mtime +30 -name '*.log' -delete"

	# remove old dev-backup, create new dev-backup, then trim dev logs
	"cd $botDir/dev"
	"git rev-parse HEAD > $deployDirRemote/dev.txt"
	"git show --oneline -s >> $deployDirRemote/dev.txt"
	"find ./logs -mtime +30 -name '*.log' -delete"

	"find /home/ec2-user/.pm2/logs -mtime +30 -name '*.log*' -delete"
)
sshRun "${sshCommands[@]}"

#endregion

#region copy to local

scpFrom "$deployDirRemote/stable.txt" "$backupDir/latest/stable.txt"
scpFrom "$deployDirRemote/beta.txt" "$backupDir/latest/beta.txt"
scpFrom "$deployDirRemote/dev.txt" "$backupDir/latest/dev.txt"

#endregion

#region delete remote zips

sshCommands=(
	"rm -f $deployDirRemote/stable.txt"
	"rm -f $deployDirRemote/beta.txt"
	"rm -f $deployDirRemote/dev.txt"
)
sshRun "${sshCommands[@]}"

#endregion

#region prune

echoAndDo "cd $scriptsDir"
echoAndDo "node data-backup.mjs"

#endregion
