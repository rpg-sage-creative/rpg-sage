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

# execute the deploy script on the remote
sshCommands=(
	"rm -f $deployDirRemote/backup.zip"
	"zip -rq9 $deployDirRemote/backup $dataDirRemote"
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
