#!/bin/bash

#region functions

# convenience method to show my command and execute it
outputToScript="false"
function echoAndDo() {
	if [ "$outputToScript" = "true" ]; then
		echo "$1" >> output.sh
	else
		echo "$1"
		eval "$1"
	fi
}

function echoLog() {
	if [ "$outputToScript" = "true" ]; then
		echo "echo \"$1\"" >> output.sh
	else
		echo "$1"
	fi
}

# convenience method to including (sourcing) other scripts
function include() {
	if [ ! -z "$1" ]; then
		local incPaths=("./$1.sh" "./inc/$1.sh" "./scripts/inc/$1.sh")
		for incPath in "${incPaths[@]}"; do
			if [ -f "$incPath" ]; then
				source "$incPath"
			fi
		done
	fi
}

# convenience method to upload a file via scp
function scpTo() {
	localPath="$1"
	remotePath="$2"
	echoAndDo "scp $sshKey $scpPort $localPath $sshHost:$remotePath"
}

# convenience method to download a file via scp
function scpFrom() {
	remotePath="$1"
	localPath="$2"
	echoAndDo "scp $sshKey $scpPort $sshHost:$remotePath $localPath"
}

function esc() {
	printf "%s\n" "$1" | sed -e "s/\"/\\\\\"/g"
}

function sshRun() {
	sshFileRemote="$botDir/deploy/ssh-cmd.sh"
	sshFileLocal="$sageRootDir/scripts/ssh-cmd.sh"

	sshCommand=""

	# execute the remote .sh file
	sshCommand="$sshCommand /bin/bash $sshFileRemote;"

	# delete the remote .sh file
	sshCommand="$sshCommand rm -f $sshFileRemote;"

	# include an exit
	sshCommand="$sshCommand exit;"

	# start script file
	echoAndDo "echo \"# start of remote script\" > $sshFileLocal"

	# add all commands to file
	sshCommands=("$@")
	for cmd in "${sshCommands[@]}"; do
		# escape those pesky quotes first!
		escaped=$(esc "$cmd")
		# write command to file
		eval "echo 'echo \"$escaped\"' >> $sshFileLocal"
		eval "echo \"$escaped\" >> $sshFileLocal"
	done

	# send file
	scpTo "$sshFileLocal" "$sshFileRemote"

	# run file
	echoAndDo "ssh $sshHost $sshKey $sshPort \"$sshCommand\""

	# remove file
	echoAndDo "rm -f $sshFileLocal"
}

#endregion

#region npm lib versions: CHANGE ONLY AS REQUIRED

include "npm"

#endregion

#region global "dir" vars

# Dir where this file is located
incDir="$(cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd)"

# Dir where the scripts files are
scriptsDir="$(dirname -- "$incDir")"

# Get Sage root folder (parent of the scripts folder containing config.sh)
sageRoot="$(basename $(dirname -- "$scriptsDir"))"
sageRootDir="$(dirname -- "$scriptsDir")"

# Dir where we are running this file from
currentDir="$(pwd)"

# local sage data backup dir
backupDir="/Users/randaltmeyer/SynologyDrive/sage-backups"

#endregion

#region ACT / ENV / PKG switches and includes

# get the action, environment, and package args/flags
ACT=
ENV=
PKG=
while test $# -gt 0; do
	case "$1" in
		start|stop|delete|restart) ACT="$1"; shift; ;;
		aws|docker|local|mini) ENV="$1"; shift; ;;
		data|dev|beta|stable|maps) PKG="$1"; shift; ;;
		-script) outputToScript="true"; shift; ;;
		*) break; ;;
	esac
done

# prep output script
if [ "$outputToScript" = "true" ]; then
	rm -rf output.sh
fi

# include the environment and package based args
include "$ENV"
include "$PKG"

#endregion
