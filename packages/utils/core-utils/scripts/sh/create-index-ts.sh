#!/bin/bash

# ensure repo root folder
if [ ! -d "./.git" ]; then
	while [ ! -d "./.git" ]; do
		cd ..
	done
	echo "cd $(pwd)"
fi

# get the right scripts folder
SCRIPT_DIR="./scripts"
if [ -d "./node_modules/@rsc-utils/core-utils" ]; then
	SCRIPT_DIR="./node_modules/@rsc-utils/core-utils/scripts"
fi
INDEX_MJS="$SCRIPT_DIR/mjs/index.mjs"

# create all the index.ts files ...
echo "Generating index.ts files ..."
node "$INDEX_MJS" indexTs -r
if [ "$?" != "0" ]; then echo "index.ts Generation Failed!"; exit 1; fi
