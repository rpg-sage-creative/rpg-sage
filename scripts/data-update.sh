#!/bin/bash

REPO_PATH=$(pwd)
echo "REPO_PATH=$REPO_PATH"

function resetPath() {
	cd "$REPO_PATH"
}

cd ~/tmp/data
TMP_DATA_PATH=$(pwd)
resetPath

WHICH="$1"

function dataBackup() {
	resetPath
	if [ -f '../scripts/data-backup.sh' ]; then
		cd ../scripts
		bash data-backup.sh aws
	else
		echo "data-backup.sh NOT FOUND"
	fi
}

function dataReset() {
	resetPath
	if [ -f '../scripts/backup-to-tmp.sh' ]; then
		cd ../scripts
		bash backup-to-tmp.sh -which "$WHICH"
	else
		echo "back-to-tmp.sh NOT FOUND"
	fi
}

function dataProcess() {
	resetPath
	node ./packages/data-layer/build/process.mjs codeName=dev "dataRoot=$TMP_DATA_PATH" "$WHICH"
}

function dataValidate() {
	resetPath
	node ./packages/data-layer/build/validate.mjs codeName=dev "dataRoot=$TMP_DATA_PATH" "$WHICH"
}

function dataUpload() {
	echo "Upload to DDB"
}

function dataCompare() {
	echo "Compare file vs DDB"
}

if [ "$WHICH" == "backup" ]; then
	dataBackup
else

	if [ "$WHICH" != "characters" ] && [ "$WHICH" != "games" ] && [ "$WHICH" != "messages" ] && [ "$WHICH" != "servers" ] && [ "$WHICH" != "users" ]; then
		read -p "Enter ObjectType: " WHICH
		if [ "$WHICH" != "characters" ] && [ "$WHICH" != "games" ] && [ "$WHICH" != "messages" ] && [ "$WHICH" != "servers" ] && [ "$WHICH" != "users" ]; then
			echo "Ok, exiting ..."
			exit 1
		fi
	fi
	echo "Which: $WHICH"

	dataReset
	dataProcess
	dataValidate
	# dataUpload
	# dataCompare
fi