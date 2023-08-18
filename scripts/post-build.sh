#!/bin/bash

# import constants and functions
[ -f "./inc/all.sh" ] && source "./inc/all.sh" || source "./scripts/inc/all.sh"

echoLog "post-build.sh starting ..."

if [ "$PKG" = "data" ]; then
	echo "Do nothing for data."
else

	echoAndDo "mkdir -p $sageRootDir/dist/data/pf2e"

	echoAndDo "cd $sageRootDir/dist/data"
	echoAndDo "ln -s $cloudSageDataDir sage"

	echoAndDo "cd $sageRootDir/dist/data/pf2e"
	echoAndDo "ln -s ../../../data/pf2e/dist dist"
	echoAndDo "ln -s ../../../data/pf2e/pf2t-leftovers.json pf2t-leftovers.json"

fi

echoLog "post-build.sh done."
