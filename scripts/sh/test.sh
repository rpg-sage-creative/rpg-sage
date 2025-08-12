#!/bin/bash

# ensure repo root folder
if [ ! -d "./.git" ]; then
	while [ ! -d "./.git" ]; do
		cd ..
	done
	echo "cd $(pwd)"
fi

ROOT_DIR="$(pwd)"
ROOT_NAME="$(basename -- "$(pwd)")"

function testModule() {
	local repoName="$1"
	local modulePath="$ROOT_DIR/modules/$repoName"

	echo "Testing: $repoName ..."

	cd "$modulePath"

	node --no-warnings --experimental-vm-modules node_modules/jest/bin/jest.js
	if [ "$?" != "0" ]; then echo "Testing: $repoName ... Failed!"; exit 1; fi
}

testModule "core-utils"
testModule "io-utils"
testModule "discord-utils"
testModule "game-utils"

echo "Skipping Testing: $ROOT_NAME ..."
exit 0

echo "Testing: $ROOT_NAME ..."

cd "$ROOT_DIR"

node --no-warnings --experimental-vm-modules node_modules/jest/bin/jest.js
if [ "$?" != "0" ]; then echo "Testing: $ROOT_NAME ... Failed!"; exit 1; fi

echo "Testing: $ROOT_NAME ... done."
