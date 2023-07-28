#!/bin/bash

# import constants and functions
[ -f "./inc/all.sh" ] && source "./inc/all.sh" || source "./scripts/inc/all.sh"

# warn if any args are missing
if [ -z "$ENV" ]; then
	echo "/bin/bash backup.sh aws"
	exit 1
fi

#region setup local backup folder and sym link it

NOW=`date '+%F-%H%M'`;

echoAndDo "cd $backupDir"
echoAndDo "rm -f ./latest"
echoAndDo "mkdir -p $NOW-$ENV"
echoAndDo "ln -s ./$NOW-$ENV ./latest"

#endregion

#region zip remote contents

# other dir vars
deployDirRemote="$botDir/deploy"
logDirRemote="$botDir/data/sage/logs"

# execute the deploy script on the remote
sshCommands=(
	# remove old backup.zip & create new one
	"rm -f $deployDirRemote/data.zip"
	"cd $botDir/data"
	"zip -rq9 $deployDirRemote/data.zip ./* -x './data/*' './node_modules/*'"

	# remove old stable-backup, create new stable-backup, then trim stable logs
	"rm -f $deployDirRemote/stable.zip"
	"cd $botDir/stable"
	"zip -rq9 $deployDirRemote/stable.zip ./* -x './data/*' './node_modules/*'"
	"find $logDirRemote/stable -mtime +30 -name '*.log' -delete"

	# remove old beta-backup, create new beta-backup, then trim beta logs
	"rm -f $deployDirRemote/beta.zip"
	"cd $botDir/beta"
	"zip -rq9 $deployDirRemote/beta.zip ./* -x './data/*' './node_modules/*'"
	"find $logDirRemote/beta -mtime +30 -name '*.log' -delete"

	# remove old dev-backup, create new dev-backup, then trim dev logs
	"rm -f $deployDirRemote/dev.zip"
	"cd $botDir/dev"
	"zip -rq9 $deployDirRemote/dev.zip ./* -x './data/*' './node_modules/*'"
	"find $logDirRemote/dev -mtime +30 -name '*.log' -delete"

	"find /home/ec2-user/.pm2/logs -mtime +30 -name '*.log*' -delete"

	# remove old log-backup, create new log-backup
	"rm -f $deployDirRemote/logs.zip"
	"cd $logDirRemote"
	"zip -rq9 $deployDirRemote/logs.zip ./*"
)
sshRun "${sshCommands[@]}"

#endregion

#region copy to local

scpFrom "$deployDirRemote/data.zip" "$backupDir/latest/data.zip"
scpFrom "$deployDirRemote/stable.zip" "$backupDir/latest/stable.zip"
scpFrom "$deployDirRemote/beta.zip" "$backupDir/latest/beta.zip"
scpFrom "$deployDirRemote/dev.zip" "$backupDir/latest/dev.zip"
scpFrom "$deployDirRemote/logs.zip" "$backupDir/latest/logs.zip"

#endregion

#region delete remote zips

sshCommands=(
	"rm -f $deployDirRemote/data.zip"
	"rm -f $deployDirRemote/stable.zip"
	"rm -f $deployDirRemote/beta.zip"
	"rm -f $deployDirRemote/dev.zip"
	"rm -f $deployDirRemote/logs.zip"
)
sshRun "${sshCommands[@]}"

#endregion

#region prune

echoAndDo "cd $scriptsDir"
echoAndDo "node backup.mjs"

#endregion
