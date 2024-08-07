#!/bin/bash

# ensure root folder
[ -d "./scripts" ] || cd ..

cd build

update=
if [ "$1" = "update" ] || [ "$2" = "update" ] || [ "$3" = "update" ]; then update="update"; fi

unified=
if [ "$1" = "unified" ] || [ "$2" = "unified" ] || [ "$3" = "unified" ]; then unified="unified"; fi

which="dev"
if [ "$1" = "beta" ] || [ "$2" = "beta" ] || [ "$3" = "beta" ]; then which="beta"; fi
if [ "$1" = "stable" ] || [ "$2" = "stable" ] || [ "$3" = "stable" ]; then which="stable"; fi


node app-commands.mjs "$update" "$unified" "codeName=$which" \
	dataRoot=/Users/randaltmeyer/git/rpg-sage-legacy-data
