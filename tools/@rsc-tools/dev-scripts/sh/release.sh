#!/bin/bash

# get release type and branch from args
TYPE=""
NO_BUILD=""
NO_TEST=""
while test $# -gt 0; do
	case "$1" in
		major|minor|patch) TYPE="$1"; shift; ;;
		--noBuild) NO_BUILD="true"; shift; ;;
		--noTest) NO_TEST="true"; shift; ;;
		*) shift; ;;
	esac
done

# ensure release type and branch args exist
if [ -z "$TYPE" ]; then
	echo "Error: Invalid release type '$TYPE'"
	echo "pnpm dev-scripts release major|minor|patch"
	exit 1
fi

CURRENT_BRANCH=`git rev-parse --abbrev-ref HEAD`
if [ "$CURRENT_BRANCH" != "develop" ]; then
	echo "Please release from branch: develop"
	exit 1
fi

function lookForXUtils {
	if [ ! -z "$(grep 'x-utils' package.json)" ]; then
		echo "Please update your package.json to replace x-utils with ${PWD##*/}"
		exit 1
	fi
}

lookForXUtils

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

if [ "$NO_BUILD" != "true" ]; then
	pnpm build
	if [ "$?" != "0" ]; then
		echo "Build failed, cannot release $TYPE."
		exit 1
	fi
fi

if [ "$NO_TEST" != "true" ]; then
	pnpm test
	if [ "$?" != "0" ]; then
		echo "Test failed, cannot release $TYPE."
		exit 1
	fi
fi

# check after we build/run (in case building/testing altered files)
lookForFilesToCommit

RELEASE_TAG=`npm version $TYPE --git-tag-version false`
git restore package.json

if [ $(git tag -l "$RELEASE_TAG") ]; then
	echo "Release already exists!"
	echo "Try: pnpm dev-scripts refresh-tags"
	exit 1
fi

read -p "Do $TYPE release: $RELEASE_TAG? ([y]es or [n]o): "
case $(echo $REPLY | tr '[A-Z]' '[a-z]') in
	y|yes) ;;
	*) exit 1 ;;
esac

RELEASE_BRANCH="release/$RELEASE_TAG"

# step 1 - create release branch
git checkout -b "$RELEASE_BRANCH"

# step 2 - update package version
pnpm version "$TYPE" -m "build(versioning): Release - %s"
if [ "$?" != "0" ]; then echo "Release Failed!"; exit 1; fi

# step 3 - push updated package version
git push origin "$RELEASE_BRANCH"
if [ "$?" != "0" ]; then echo "Release Failed!"; exit 1; fi

# step 4 - merge release back into main
git fetch origin main:main
git checkout main
git merge "$RELEASE_BRANCH" -m "Merging '$RELEASE_BRANCH'"
git push origin main

# step 5 - recreate develop
git branch -D develop || true
git push origin --delete develop || true
git checkout -b develop
git push origin develop

# step 6 - delete release branch
git branch -D "$RELEASE_BRANCH" || true
git push origin --delete "$RELEASE_BRANCH" || true

# step 7 - push tags
git push --tags

# step 8 - refresh tags
git tag -l | xargs git tag -d
git fetch -p --tags

echo "Release $RELEASE_TAG ($TYPE) Done."
