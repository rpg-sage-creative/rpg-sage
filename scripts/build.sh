#!/bin/bash

# ensure root folder
[ -d "./scripts" ] || cd ..

# scrub build/buildinfo
bash scripts/scrub.sh build

# ensure we aren't missing things like pdf2json/index.d.ts
bash scripts/node-module-fixes.sh

echo 'build started.'

# do the actual build
tsc --build tsconfig.json

# ensure we have a version.txt listing this build's info
bash scripts/version.sh

echo 'build done.'