#!/bin/bash

# ensure repo root folder
if [ ! -d "./.git" ]; then
	while [ ! -d "./.git" ]; do
		cd ..
	done
	echo "cd $(pwd)"
fi

repoDir=$(pwd)
cd ../rsc
utilsDir=$(pwd)
cd "$repoDir"

repoNames=(
	"args-utils"
	"array-utils"
	"async-array-utils"
	"cache-utils"
	"character-utils"
	"class-utils"
	"color-utils"
	"console-utils"
	"date-utils"
	"dice-utils"
	"discord-utils"
	"enum-utils"
	"env-utils"
	"fs-utils"
	"https-utils"
	"json-utils"
	"language-utils"
	# "maps-utils"
	"math-utils"
	"number-utils"
	"pdf-utils"
	"progress-utils"
	"random-utils"
	"render-utils"
	"search-utils"
	"snowflake-utils"
	"string-utils"
	"temperature-utils"
	"type-utils"
	"uuid-utils"
)

echo "Configuring Packages ..."

packagesDir="$repoDir/packages/utils"
if [ ! -d "$packagesDir" ]; then
	mkdir -p "$packagesDir"
fi

for repoName in "${repoNames[@]}"; do
	srcDir="$utilsDir/$repoName"
	destDir="$packagesDir/$repoName"

	echo "Adding Package: $repoName ..."
	rm -rf "$destDir"
	mkdir "$destDir"
	cp -r "$srcDir/src" "$destDir/src"
	if [ "$repoName" = "console-utils" ]; then
		cp -r "$srcDir/scripts" "$destDir/scripts"
	fi
	if [ "$repoName" = "language-utils" ]; then
		cp -r "$srcDir/data" "$destDir/data"
	fi

	# update package.json details
	echo "Adding $repoName/package.json ..."
	cd "$srcDir"
	jsonName=$(npm pkg get name)
	jsonVer='"0.0.0"'
	# jsonVer=$(npm pkg get version)
	jsonDep=$(npm pkg get dependencies)
	jsonRaw="{\"name\":$jsonName,\"version\":$jsonVer,\"private\":true,\"main\":\"build/index.js\",\"type\":\"module\",\"dependencies\":$jsonDep}"
	echo "$jsonRaw" | sed -e 's/github:rpg-sage-creative\/[a-zA-Z]*-utils/^0.0.0/g' > "$destDir/package.json"

	# update tsconfig.json
	echo "Adding $repoName/tsconfig.json ..."
	echo "{\"extends\":\"../../../tsconfig.base.json\",\"compilerOptions\":{\"outDir\":\"./build\",\"rootDir\":\"./src\"}}" > "$destDir/tsconfig.json"
done

echo "Configuring Packages ... done."

cd "$repoDir"
rm -rf node_modules package-lock.json
npm i