#!/bin/bash

# ensure root folder
[ -d "./scripts" ] || cd ..

bash scripts/build.sh

DATA_ROOT="/home/ec2-user/legacy/data"
if [ -d "/Users/randaltmeyer/git/rpg-sage-legacy-data" ]; then
	DATA_ROOT="/Users/randaltmeyer/git/rpg-sage-legacy-data"
fi

if [ "$1" = "pm2" ]; then

	pm2 start mono.config.cjs --env dev

else

	cd build
	node --experimental-modules \
		--es-module-specifier-resolution=node \
		mono.mjs \
		botCodeName=dev \
		"dataRoot=$DATA_ROOT" \
		superUserId=253330271678627841 \
		homeServerId=963531189254238278

fi
