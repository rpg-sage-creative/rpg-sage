#!/bin/bash

# ensure root folder
[ -d "./scripts" ] || cd ..

bash scripts/scrub.sh pm2

bash scripts/build.sh

if [ "$1" = "pm2" ]; then

	pm2 start mono.config.cjs --env dev

else

	cd build
	node --experimental-modules \
		--es-module-specifier-resolution=node \
		mono.mjs \
		botCodeName=dev \
		dataRoot=/Users/randaltmeyer/git/rpg-sage-legacy-data \
		superUserId=253330271678627841 \
		homeServerId=963531189254238278

fi
