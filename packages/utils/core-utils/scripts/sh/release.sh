#!/bin/bash

# ensure repo root folder
if [ ! -d "./.git" ]; then
	while [ ! -d "./.git" ]; do
		cd ..
	done
	echo "cd $(pwd)"
fi

# get release type and branch from args
TYPE=""
while test $# -gt 0; do
	case "$1" in
		major|minor|patch) TYPE="$1"; shift; ;;
		*) shift; ;;
	esac
done

# ensure release type and branch args exist
if [ -z "$TYPE" ]; then
	echo "release.sh $TYPE"
	echo "/bin/bash release.sh major|minor|patch"
	exit 1
fi

function promptForce {
	local yn
	read -p "Force release $TYPE? (y/n) " yn
	if [ "$yn" != "y" ]; then
		exit 1
	fi
}

function lookForFilesToCommit {
	test -z `git ls-files --exclude-standard --others`
	if [ "$?" != "0" ]; then
		echo "You have untracked files, cannot release $TYPE."
		promptForce
	fi

	git diff-index --quiet --cached HEAD --
	if [ "$?" != "0" ]; then
		echo "You have uncommitted staged changes, cannot release $TYPE."
		promptForce
	fi

	git diff-files --ignore-space-at-eol --quiet
	if [ "$?" != "0" ]; then
		echo "You have unstaged changes, cannot release $TYPE."
		promptForce
	fi
}

# check before we build/run
lookForFilesToCommit

npm run build
if [ "$?" != "0" ]; then
	echo "Build failed, cannot release $TYPE."
	exit 1
fi

npm run test
if [ "$?" != "0" ]; then
	echo "Test failed, cannot release $TYPE."
	exit 1
fi

# check after we build/run (in case building/testing altered files)
lookForFilesToCommit

SCRIPT_DIR="./scripts"
if [ -d "./node_modules/@rsc-utils/core-utils" ]; then
	SCRIPT_DIR="./node_modules/@rsc-utils/core-utils/scripts"
fi
INDEX_MJS="$SCRIPT_DIR/mjs/index.mjs"

TARGET_VERSION=`node $INDEX_MJS version $TYPE dry | tail -n 1`

read -p "Do $TYPE release: $TARGET_VERSION? ([y]es or [n]o): "
case $(echo $REPLY | tr '[A-Z]' '[a-z]') in
	y|yes) ;;
	*) exit 1 ;;
esac

# step 2 - update package version
node "$INDEX_MJS" version "$TYPE"
if [ "$?" != "0" ]; then echo "Release Failed!"; exit 1; fi

# step 3 - update build hash and create a new build.json
bash "$SCRIPT_DIR/sh/build-info.sh"
if [ "$?" != "0" ]; then echo "Release Failed!"; exit 1; fi

# step 4 - commit package.json and build.json changes and push
git add build.json package.json
if [ "$?" != "0" ]; then echo "Release Failed!"; exit 1; fi

git commit -m "build(versioning): Release - $TARGET_VERSION"
if [ "$?" != "0" ]; then echo "Release Failed!"; exit 1; fi

git push
if [ "$?" != "0" ]; then echo "Release Failed!"; exit 1; fi

# step 5 - create release tag
PACKAGE_VERSION=$(cat package.json | grep \\\"version\\\" | head -1 | awk -F: '{ print $2 }' | sed 's/[\",]//g' | tr -d '[[:space:]]')
git tag "v$PACKAGE_VERSION"
if [ "$?" != "0" ]; then echo "Release Failed!"; exit 1; fi

git push --tags

echo "Release $TARGET_VERSION ($TYPE) Done."
