#!/bin/bash

# ensure root folder
[ -d "./scripts" ] || cd ..

# ensure a fresh build
bash scripts/build.sh

echo 'test started.'

cd ./tests;
node --es-module-specifier-resolution=node index.mjs

echo 'test done.'