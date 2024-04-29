#!/bin/bash

# ensure root folder
[ -d "./scripts" ] || cd ..

botCodeName="dev"
echo "botCodeName=\"$botCodeName\""

RETVAL=""
function readJsonProperty() {
	RETVAL=""
	jsonKey="$1"
	RETVAL=$(grep -E "\"$jsonKey\"\: ?\"([^\"]+)\"" "./config/$botCodeName.env.json")
	if [ -z "$RETVAL" ]; then
		RETVAL=$(grep -E "\"$jsonKey\"\: ?\"([^\"]+)\"" ./config/env.json)
	fi
	RETVAL=$(sed -r 's/"([^"]+)": ?"([^"]+)",?/\2/g' <<< "$RETVAL")
	RETVAL=$(xargs <<< "$RETVAL")
	echo "$jsonKey=\"$RETVAL\""
}

readJsonProperty "dataRoot"
jsonDataRoot="$RETVAL"

readJsonProperty "homeServerId"
jsonHomeServerId="$RETVAL"

readJsonProperty "rollemId"
jsonRollemId="$RETVAL"

readJsonProperty "superAdminId"
jsonSuperAdminId="$RETVAL"

readJsonProperty "superUserId"
jsonSuperUserId="$RETVAL"

readJsonProperty "tupperBoxId"
jsonTupperBoxId="$RETVAL"

exit

npm run test
if [ "$?" != "0" ]; then echo "Unable to Start 'mono'!"; exit 1; fi

if [ "$1" = "pm2" ]; then

	pm2 start mono.config.cjs --env "$botCodeName"

else

	cd build
	node --experimental-modules \
		--es-module-specifier-resolution=node \
		mono.mjs \
		"botCodeName=$botCodeName" \
		"dataRoot=$jsonDataRoot" \
		"homeServerId=$jsonHomeServerId" \
		"rollemId=$jsonRollemId" \
		"superAdminId=$jsonSuperAdminId" \
		"superUserId=$jsonSuperUserId" \
		"tupperBoxId=$jsonTupperBoxId"

fi
