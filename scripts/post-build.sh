#!/bin/bash

# bring in all the config information
if [ -f "./config.sh" ]; then
	source "./config.sh"
elif [ -f "./scripts/config.sh" ]; then
	source "./scripts/config.sh"
fi

echo "post-build.sh starting ..."

mkdir "$sageRootDir/dist/data"
mkdir "$sageRootDir/dist/data/pf2e"

cd "$sageRootDir/dist/data"
eval "ln -s $cloudSageDataDir sage"

cd "$sageRootDir/dist/data/pf2e"
eval "ln -s ../../../data/pf2e/dist dist"
eval "ln -s ../../../data/pf2e/pf2-tools.json pf2-tools.json"

# Add any other post-build tasks here

echo "post-build.sh done."
