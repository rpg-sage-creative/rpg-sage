#!/bin/bash

# import constants and functions
[ -f "./inc/all.sh" ] && source "./inc/all.sh" || source "./scripts/inc/all.sh"

echoLog "run-tests.sh starting ..."

if [ "$PKG" = "data" ]; then

	appTestsDir="$sageRootDir/tests"

	if [ -f "$appTestsDir/run.mjs" ]; then
		echoAndDo "cd $appTestsDir"
		echoAndDo "node --es-module-specifier-resolution=node run.mjs"
	else
		echoLog "run-tests.sh skipped."
		exit 0
	fi

# else
fi

echoLog "run-tests.sh done."
