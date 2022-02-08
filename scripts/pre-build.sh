#!/bin/bash

# bring in all the config information
if [ -f "./config.sh" ]; then
	source "./config.sh"
elif [ -f "./scripts/config.sh" ]; then
	source "./scripts/config.sh"
fi

echo "pre-build.sh starting ..."

cd "$sageRootDir"

eval "rm -rf dist"

eval "rm -rf types"

# Add any other pre-build tasks here

echo "pre-build.sh done."
