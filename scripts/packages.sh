#!/bin/bash

# ensure repo root folder
if [ ! -d "./.git" ]; then
	while [ ! -d "./.git" ]; do
		cd ..
	done
	echo "cd $(pwd)"
fi

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
	"test-utils"
	"type-utils"
	"uuid-utils"
)

if [ ! -z "$1" ]; then
	repoNames=( "$1" )
fi

# get current working dir (should be project/repo/git root dir)
repoDir=$(pwd)

echo "Configuring Packages ..."

# make sure we have ./packages/utils
packagesDir="$repoDir/packages/utils"
if [ ! -d "$packagesDir" ]; then
	mkdir -p "$packagesDir"
fi

nodeModulesDir="$repoDir/node_modules/@rsc-utils"
if [ ! -d "$nodeModulesDir" ]; then
	mkdir -p "$nodeModulesDir"
fi

rm -f .gitmodules
echo "" > .gitmodules

for repoName in "${repoNames[@]}"; do
	# start in the repo dir
	cd "$repoDir"

	# delete a non-repo
	if [ ! -d "./packages/utils/$repoName/.gitignore" ]; then
		echo "Removing old junk: ./packages/utils/$repoName ..."
		rm -rf "./packages/utils/$repoName"
		git rm -r --cached "./packages/utils/$repoName"
		git commit -m "moved to submodule"
	fi

	# get repo url and dir
	repoUrl="git@github.com:rpg-sage-creative/$repoName.git"
	destDir="./packages/utils/$repoName"

	echo "Adding submodule: $repoName ..."
	git submodule add -f "$repoUrl" "$destDir"

	# update node_modules symbolic links
	rm -rf "$nodeModulesDir/$repoName"
	cd "$nodeModulesDir"
	ln -s "../../packages/utils/$repoName" "$repoName"
done

echo "Configuring Packages ... done."

cd "$repoDir"
rm -rf package-lock.json
# npm i