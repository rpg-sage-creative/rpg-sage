#!/bin/bash

# ensure root folder
[ -d "./scripts" ] || cd ..

cd build

update=
if [ "$1" = "update" ] || [ "$2" = "update" ]; then update="update"; fi

which="dev"
if [ "$1" = "beta" ] || [ "$2" = "beta" ]; then which="beta"; fi
if [ "$1" = "stable" ] || [ "$2" = "stable" ]; then which="stable"; fi


node --experimental-modules \
	--es-module-specifier-resolution=node \
	slash.mjs \
	"$update" \
	"botCodeName=$which" \
	dataRoot=/Users/randaltmeyer/git/rpg-sage-legacy-data
