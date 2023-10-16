#!/bin/bash

[ -d "./scripts" ] || cd ..

function scrubBuild() {
	# scrub build folders
	find . -type d -name 'build' -exec rm -rf {} +
}

function scrubLogs() {
	# scrub log files
	find . -type f -name '*.log' -exec rm -rf {} +
}

if [ "$1" = "build" ]; then
	scrubBuild

elif [ "$1" = "logs" ]; then
	scrubLogs

else
	scrubBuild
	scrubLogs

fi

echo "scrub $1 done."