#!/bin/bash

function esc() {
	printf "%s\n" "$1" | sed -e "s/\"/\\\\\"/g"
}

# ensure repo root folder
if [ ! -d "./.git" ]; then
	while [ ! -d "./.git" ]; do
		cd ..
	done
	echo "cd $(pwd)"
fi

FILE="build.json"

NAME=`npm pkg get name`
VERSION=`npm pkg get version`

BUILD_TS=`date +"%s"`
BUILD_DATE=`gdate -d @"$BUILD_TS" '+%F-%H%M'`

BUILD_BRANCH=`git branch --show-current`
BUILD_BRANCH=$(esc "$BUILD_BRANCH")

COMMIT=`git show -s --format='%H'`
COMMIT_SUBJECT=`git show -s --format='%s'`
COMMIT_SUBJECT=$(esc "$COMMIT_SUBJECT")

COMMIT_TS=`git show -s --format='%ct'`
COMMIT_DATE=`gdate -d @"$COMMIT_TS" '+%F-%H%M'`

AUTHOR=`git show -s --format='%an'`
AUTHOR=$(esc "$AUTHOR")

echo '{' > $FILE
echo "\"name\":$NAME," >> $FILE
echo "\"version\":$VERSION," >> $FILE
echo "\"branch\":\"$BUILD_BRANCH\"," >> $FILE
echo "\"commit\":\"$COMMIT\"," >> $FILE
echo "\"commitSubject\":\"$COMMIT_SUBJECT\"," >> $FILE
echo "\"commitTs\":"$COMMIT_TS"000," >> $FILE
echo "\"commitDate\":\"$COMMIT_DATE\"," >> $FILE
echo "\"buildTs\":"$BUILD_TS"000," >> $FILE
echo "\"buildDate\":\"$BUILD_DATE\"," >> $FILE
echo "\"author\":\"$AUTHOR\"" >> $FILE
echo '}' >> $FILE