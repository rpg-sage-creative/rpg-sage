#!/bin/bash

# import constants and functions
[ -f "./inc/all.sh" ] && source "./inc/all.sh" || source "./scripts/inc/all.sh"

echoLog "pre-build.sh starting ..."

if [ "$PKG" = "data" ]; then
	echo "Do nothing for data."
else
	echoAndDo "cd $sageRootDir"
	echoAndDo "rm -rf dist"
	echoAndDo "rm -rf types"
fi

echoLog "pre-build.sh done."
