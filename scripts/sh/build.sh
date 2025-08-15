#!/bin/bash

# ensure repo root folder
if [ ! -d "./.git" ]; then
	while [ ! -d "./.git" ]; do
		cd ..
	done
	echo "cd $(pwd)"
fi

# make sure we have something to build
if [ ! -f "./tsconfig.json" ]; then
	echo "Nothing to Build."
	exit 1
fi

ROOT_DIR="$(pwd)"
ROOT_NAME="$(basename -- "$(pwd)")"

# scrub build folders
echo "Scrubbing build folders ..."
find . -type d -name 'build' -not -path '*/node_modules/*'  -exec rm -rf {} +

# scrub build info
echo "Scrubbing tsbuildinfo files ..."
find . -type f -name '*.tsbuildinfo' -not -path './node_modules/*' -exec rm -rf {} +

# we have a known issue with this lib needing this "declare module"
if [ -d "./node_modules/pdf2json" ]; then
	if [ ! -f "./node_modules/pdf2json/index.d.ts" ]; then
		echo "Creating: ./node_modules/pdf2json/index.d.ts";
		echo 'declare module "pdf2json";' > ./node_modules/pdf2json/index.d.ts
	fi
fi

SCRIPT_DIR="$ROOT_DIR/scripts"
INDEX_MJS="$SCRIPT_DIR/mjs/index.mjs"

function buildModule() {
	local repoName="$1"
	local modulePath="$ROOT_DIR/modules/$repoName"

	echo "Building: $repoName ..."

	cd "$modulePath"

	if [ ! -d "./node_modules" ]; then
		npm i
	fi

	node "$INDEX_MJS" indexTs -r
	if [ "$?" != "0" ]; then echo "Error generating index.ts files!"; exit 1; fi

	tsc --build tsconfig.json
	if [ "$?" != "0" ]; then echo "Building: $repoName ... Failed!"; exit 1; fi

	tsc --build tsconfig.d.json
	if [ "$?" != "0" ]; then echo "Building: $repoName ... Failed!"; exit 1; fi
}

buildModule "core-utils"
buildModule "io-utils"
buildModule "discord-utils"
buildModule "game-utils"

echo "Building: $ROOT_NAME ..."

cd "$ROOT_DIR"

# transpile the TS
echo "Building tsconfig.json ..."
tsc --build tsconfig.json
if [ "$?" != "0" ]; then echo "Build Failed!"; exit 1; fi

# build out the .d.ts files that exclude the private/internal docs
if [ -f "./tsconfig.d.json" ]; then
	echo "Building tsconfig.d.json ..."
	tsc --build tsconfig.d.json
	if [ "$?" != "0" ]; then echo "Build Failed!"; exit 1; fi
fi

echo "Building: $ROOT_NAME ... done."