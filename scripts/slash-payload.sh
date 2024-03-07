#!/bin/bash

# ensure root folder
[ -d "./scripts" ] || cd ..

cd build

update=
if [ "$1" = "update" ]; then update="update"; fi

node --experimental-modules \
	--es-module-specifier-resolution=node \
	slash.mjs \
	"$update" \
	botCodeName=dev \
	dataRoot=/Users/randaltmeyer/git/rpg-sage-legacy-data
