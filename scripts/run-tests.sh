#!/bin/bash

#region consts and imports

# bring in all the config information
if [ -f "./config.sh" ]; then
	source "./config.sh"
elif [ -f "./scripts/config.sh" ]; then
	source "./scripts/config.sh"
fi

#endregion

# runs tests if they exist
appTestsDir="$sageRootDir/tests"

if [ ! -f "$appTestsDir/run.mjs" ]; then
	echo "run-tests.sh '$currentApp' skipped."
	exit 0;
fi

echo "run-tests.sh starting ..."

cd "$appTestsDir"

node --es-module-specifier-resolution=node run.mjs

echo "run-tests.sh done."
