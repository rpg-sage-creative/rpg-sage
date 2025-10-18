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

SCRIPT_DIR="$ROOT_DIR/scripts"
INDEX_MJS="$SCRIPT_DIR/mjs/index.mjs"

function scrubModule() {
	local repoName="$1"
	local modulePath="$ROOT_DIR/modules/$repoName"

	cd "$modulePath"

	echo "Scrubbing: $repoName ..."

	# scrub node_modules folder
	echo "  Deleting node_modules folder ..."
	rm -rf node_modules

	# scrub build folder
	echo "  Deleting build folder ..."
	rm -rf build

	# scrub build info
	echo "  Deleting tsbuildinfo files ..."
	rm -f *.tsbuildinfo

	# scrub package-lock
	echo "  Deleting package-lock file ..."
	rm -f package-lock.json

	echo "  Updating from repo ..."
	git pull

	echo "  Installing node_modules ..."
	npm i

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

scrubModule "core-utils"
scrubModule "io-utils"
scrubModule "discord-utils"
scrubModule "game-utils"

cd "$ROOT_DIR"

echo "Cleaning: $ROOT_NAME ..."

# scrub node_modules folder
echo "  Deleting node_modules folder ..."
rm -rf node_modules
rm -f package-lock.json

# scrub build folders
echo "  Deleting build folders ..."
find . -type d -name 'build' -not -path '*/node_modules/*' -not -path './modules/*'  -exec rm -rf {} +

# scrub build info
echo "  Deleting tsbuildinfo files ..."
find . -type f -name '*.tsbuildinfo' -not -path './node_modules/*' -not -path './modules/*' -exec rm -rf {} +

echo "Building: $ROOT_NAME ..."

echo "  Installing node_modules ..."
npm i

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