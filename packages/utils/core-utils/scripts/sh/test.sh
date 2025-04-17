#!/bin/bash

# ensure repo root folder
if [ ! -d "./.git" ]; then
	while [ ! -d "./.git" ]; do
		cd ..
	done
	echo "cd $(pwd)"
fi

# check if we were passed a specific test file
specificFile=
case $1 in *.test.js) specificFile="$1";; esac

# we don't need to build if we are passed a specific test file
if [ -z "$specificFile" ]; then
	npm run build
	if [ "$?" != "0" ]; then echo "Unable to Test!"; exit 1; fi
fi

# if we are testing from a specific .ts file with a related test, just run that test
if [ -z "$specificFile" ]; then
	found=
	case $1 in *.ts) found="$1";; esac
	if [ ! -z "$found" ]; then
		found="${found/src/test}"
		found="${found/.ts/.test.js}"
		if [ -f "$found" ]; then
			specificFile="$found"
		fi
	fi
fi

echo ""
repoName="$(basename -- "$(pwd)")"
echo "Testing: $repoName ..."

node --no-warnings --experimental-vm-modules node_modules/jest/bin/jest.js "$specificFile"
if [ "$?" != "0" ]; then echo "Test Failed!"; exit 1; fi

echo ""
echo "Testing: $repoName ... done."
