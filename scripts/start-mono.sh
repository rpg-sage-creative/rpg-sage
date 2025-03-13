#!/bin/bash

# ensure root folder
[ -d "./scripts" ] || cd ..

codeName="dev"
echo "codeName=\"$codeName\""

envMonoCodeFile="./config/env.mono.$codeName.json"
if [ ! -f "$envMonoCodeFile" ]; then
	echo "File Not Found: $envMonoCodeFile"
fi

envMonoFile="./config/env.mono.json"
if [ ! -f "$envMonoFile" ]; then
	echo "File Not Found: $envMonoFile"
fi

envFile="./config/env.json"
if [ ! -f "$envFile" ]; then
	echo "File Not Found: $envFile"
fi

RETVAL=""
function readJsonProperty() {
	RETVAL=""
	jsonKey="$1"

	if [ -f "$envMonoCodeFile" ]; then
		RETVAL=$(grep -E "\"$jsonKey\"\: ?\"([^\"]+)\"" "$envMonoCodeFile")
	fi

	if [ -z "$RETVAL" ] && [ -f "$envMonoFile" ]; then
		RETVAL=$(grep -E "\"$jsonKey\"\: ?\"([^\"]+)\"" "$envMonoFile")
	fi

	if [ -z "$RETVAL" ] && [ -f "$envFile" ]; then
		RETVAL=$(grep -E "\"$jsonKey\"\: ?\"([^\"]+)\"" "$envFile")
	fi

	RETVAL=$(sed -r 's/"([^"]+)": ?"([^"]+)",?/\2/g' <<< "$RETVAL")
	RETVAL=$(xargs <<< "$RETVAL")
	echo "$jsonKey=\"$RETVAL\""
}

readJsonProperty "dataRoot"
jsonDataRoot="$RETVAL"

readJsonProperty "homeServerId"
jsonHomeServerId="$RETVAL"

readJsonProperty "mapSecure"
mapSecure="$RETVAL"

readJsonProperty "mapHostname"
mapHostname="$RETVAL"

readJsonProperty "mapPort"
mapPort="$RETVAL"

readJsonProperty "rollemId"
jsonRollemId="$RETVAL"

readJsonProperty "superAdminId"
jsonSuperAdminId="$RETVAL"

readJsonProperty "superUserId"
jsonSuperUserId="$RETVAL"

readJsonProperty "tupperBoxId"
jsonTupperBoxId="$RETVAL"

if [ ! "$1" = "-noBuild" ]; then
	npm run test
	if [ "$?" != "0" ]; then echo "Unable to Start 'mono'!"; exit 1; fi
fi

if [ "$1" = "pm2" ]; then

	pm2 start mono.config.cjs --env "$codeName"

else

	cd build
	node --experimental-modules \
		--es-module-specifier-resolution=node \
		mono.mjs \
		"codeName=$codeName" \
		"dataRoot=$jsonDataRoot" \
		"homeServerId=$jsonHomeServerId" \
		"mapSecure=$mapSecure" \
		"mapHostname=$mapHostname" \
		"mapPort=$mapPort" \
		"rollemId=$jsonRollemId" \
		"superAdminId=$jsonSuperAdminId" \
		"superUserId=$jsonSuperUserId" \
		"tupperBoxId=$jsonTupperBoxId"

fi
