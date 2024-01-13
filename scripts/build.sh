#!/bin/bash

# ensure root folder
[ -d "./scripts" ] || cd ..

# scrub build folders
find . -type d -name 'build' -not -path './node_modules/*' -exec rm -rf {} +

# scrub build info
find . -type f -name 'tsconfig.tsbuildinfo' -not -path './node_modules/*' -exec rm -rf {} +

# ensure we aren't missing things like pdf2json/index.d.ts
bash scripts/node-module-fixes.sh

echo 'build started.'

# do the actual build
tsc --build tsconfig.json

echo 'build done.'