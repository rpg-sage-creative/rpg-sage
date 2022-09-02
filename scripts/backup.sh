#!/bin/bash

#region consts and imports

# bring in all the config information
if [ -f "./config.sh" ]; then
	source "./config.sh"
elif [ -f "./scripts/config.sh" ]; then
	source "./scripts/config.sh"
fi

#endregion

sageScriptsDir="$sageRootDir/scripts"

#region zip remote data

botLogDirRemote="$botDirRemote/data/sage/logs"

# execute the deploy script on the remote
sshCommands=(
	# remove old backup.zip & create new one
	"rm -f $deployDirRemote/backup.zip"
	"zip -rq9 $deployDirRemote/backup $dataDirRemote"
	# remove old stable-backup, create new stable-backup, then trim stable logs
	"rm -rf $botDirRemote/stable-backup"
	"cp -r $botDirRemote/stable $botDirRemote/stable-backup"
	"find $botLogDirRemote/stable -mtime +30 -name '*.log' -delete"
	# remove old beta-backup, create new beta-backup, then trim beta logs
	"rm -rf $botDirRemote/beta-backup"
	"cp -r $botDirRemote/beta $botDirRemote/beta-backup"
	"find $botLogDirRemote/beta -mtime +30 -name '*.log' -delete"
	# remove old dev-backup, create new dev-backup, then trim dev logs
	"rm -rf $botDirRemote/dev-backup"
	"cp -r $botDirRemote/dev $botDirRemote/dev-backup"
	"find $botLogDirRemote/dev -mtime +30 -name '*.log' -delete"
)
/bin/bash "$sageScriptsDir/ssh.sh" "$sshHostRemote" "${sshCommands[@]}"

#endregion

#region copy to local

NOW=`date '+%F-%H%M'`;
echoAndDo "scp $sshHostRemote:$deployDirRemote/backup.zip $backupDir/$NOW.zip"

#endregion

#region delete remote zip

sshCommands=(
	"rm -f $deployDirRemote/backup.zip"
)
/bin/bash "$sageScriptsDir/ssh.sh" "$sshHostRemote" "${sshCommands[@]}"

#endregion
