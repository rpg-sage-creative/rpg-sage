#!/bin/bash

# ensure repo root folder
if [ ! -d "./.git" ]; then
	while [ ! -d "./.git" ]; do
		cd ..
	done
	echo "cd $(pwd)"
fi

# always do a new build
npm run build
if [ "$?" != "0" ]; then echo "Unable to Test!"; exit 1; fi

echo ""
repoName="$(basename -- "$(pwd)")"
echo "Testing: $repoName ..."

function checkForTests() {
	local found=false
	for file in ./test/*.mjs; do
		[ -f "$file" ] && found=true
	done
	for file in ./test/*/*.mjs; do
		[ -f "$file" ] && found=true
	done
	echo ${found}
}

# make sure we have tests
hasTests=$(checkForTests);
if [ "$hasTests" = "false" ]; then
	echo "Nothing to Test."
	exit 0
fi

function runTest() {
	echo ""
	echo "Testing: $1 ..."
	node $1 $2 $3 $4 $5 $6 $7 $8 $9
	if [ "$?" != "0" ]; then echo "Test Failed!"; exit 1; fi
	echo "Testing: $1 ... done."
}

# run the tests
for file in ./test/*.*js; do
	[ -f "$file" ] && runTest $file $1 $2 $3 $4 $5 $6 $7 $8
done
for file in ./test/*/*.*js; do
	[ -f "$file" ] && runTest $file $1 $2 $3 $4 $5 $6 $7 $8
done

echo ""
echo "Testing: $repoName ... done."
