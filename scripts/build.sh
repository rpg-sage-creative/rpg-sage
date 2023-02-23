#!/bin/bash

# import constants and functions
[ -f "./inc/all.sh" ] && source "./inc/all.sh" || source "./scripts/inc/all.sh"

echoLog "build.sh starting ..."

if [ "$PKG" = "data" ]; then
	echoLog "processData ?"
else
	echoAndDo "cd $sageRootDir"
	echoAndDo "tsc --build tsconfig.json"
fi

echoLog "build.sh done."
