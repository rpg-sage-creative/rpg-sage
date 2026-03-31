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
YEAR="$2"

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
	local objectType="$1"
	local year="$2"
	resetPath
	if [ -f '../scripts/backup-to-tmp.sh' ]; then
		cd ../scripts
		bash backup-to-tmp.sh -which "$objectType" -year "$year"
	else
		echo "back-to-tmp.sh NOT FOUND"
	fi
}

function dataProcess() {
	local objectType="$1"
	local year="$2"
	resetPath
	node ./packages/data-layer/build/process.mjs codeName=dev "dataRoot=$TMP_DATA_PATH" "$objectType" "$year"
}

function dataValidate() {
	local objectType="$1"
	local year="$2"
	resetPath
	node ./packages/data-layer/build/validate.mjs codeName=dev "dataRoot=$TMP_DATA_PATH" "$objectType" "$year"
}

function dataUpload() {
	local objectType="$1"
	local year="$2"
	resetPath
	node ./packages/data-layer/build/upload.mjs codeName=dev "dataRoot=$TMP_DATA_PATH" "$objectType" "$year"
}

function dataCompare() {
	echo "Compare file vs DDB"
}

function dataStack() {
	local objectType="$1"
	local year="$2"
	dataReset "$objectType" "$year"
	dataProcess "$objectType" "$year"
	dataValidate "$objectType" "$year"
	# dataUpload
	# dataCompare
}

function dataIds() {
	resetPath
	node ./packages/data-layer/build/ids.mjs codeName=dev "dataRoot=$TMP_DATA_PATH"
}

if [ "$WHICH" == "backup" ]; then

	dataBackup

elif [ "$WHICH" == "ids" ]; then

	dataIds

else

	if [ "$WHICH" != "characters" ] && [ "$WHICH" != "games" ] && [ "$WHICH" != "messages" ] && [ "$WHICH" != "servers" ] && [ "$WHICH" != "users" ] && [ "$WHICH" != "all" ]; then
		read -p "Enter ObjectType: " WHICH
		if [ "$WHICH" != "characters" ] && [ "$WHICH" != "games" ] && [ "$WHICH" != "messages" ] && [ "$WHICH" != "servers" ] && [ "$WHICH" != "users" ] && [ "$WHICH" != "all" ]; then
			echo "Ok, exiting ..."
			exit 1
		fi
	fi
	echo "Which: $WHICH"

	if [ "$WHICH" = "all" ]; then

		dataStack games
		dataStack servers
		dataStack users

		YEARS=( "2021" "2022" "2023" "2024" "2025" "2026" )
		for year in "${YEARS[@]}"; do

			dataStack messages "$year"

		done

	elif [ "$WHICH" = "messages" ] && [ -z "$YEAR" ]; then

		YEARS=( "2021" "2022" "2023" "2024" "2025" "2026" )
		for year in "${YEARS[@]}"; do

			dataStack messages "$year"

		done

	else

		dataStack "$WHICH" "$YEAR"

	fi
fi