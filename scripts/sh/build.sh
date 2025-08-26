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

	cd "$modulePath"

	echo "Cleaning: $repoName ..."

	# scrub build folder
	echo "  Deleting build folder ..."
	rm -rf build

	# scrub build info
	echo "  Deleting tsbuildinfo files ..."
	rm -f *.tsbuildinfo

	echo "Building: $repoName ..."

	if [ ! -d "./node_modules" ]; then
		echo "  Installing node_modules ..."
		npm i
	fi

	echo "  Generating index.ts files ..."
	node "$INDEX_MJS" indexTs -r
	if [ "$?" != "0" ]; then echo "Error generating index.ts files!"; exit 1; fi

	echo "  Transpiling ts files ..."
	tsc --build tsconfig.json
	if [ "$?" != "0" ]; then echo "Building: $repoName ... Failed!"; exit 1; fi

	echo "  Generating declaration files ..."
	tsc --build tsconfig.d.json
	if [ "$?" != "0" ]; then echo "Building: $repoName ... Failed!"; exit 1; fi
}

buildModule "core-utils"
buildModule "io-utils"
buildModule "discord-utils"
buildModule "game-utils"

cd "$ROOT_DIR"

echo "Cleaning: $ROOT_NAME ..."

# scrub build folders
echo "  Deleting build folders ..."
find . -type d -name 'build' -not -path '*/node_modules/*' -not -path './modules/*'  -exec rm -rf {} +

# scrub build info
echo "  Deleting tsbuildinfo files ..."
find . -type f -name '*.tsbuildinfo' -not -path './node_modules/*' -not -path './modules/*' -exec rm -rf {} +

echo "Building: $ROOT_NAME ..."

if [ ! -d "./node_modules" ]; then
	echo "  Installing node_modules ..."
	npm i
fi

# transpile the TS
echo "  Transpiling ts files ..."
tsc --build tsconfig.json
if [ "$?" != "0" ]; then echo "Build Failed!"; exit 1; fi

# build out the .d.ts files that exclude the private/internal docs
if [ -f "./tsconfig.d.json" ]; then
	echo "  Generating declaration files ..."
	tsc --build tsconfig.d.json
	if [ "$?" != "0" ]; then echo "Build Failed!"; exit 1; fi
fi

echo "Building: $ROOT_NAME ... done."