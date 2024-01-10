#!/bin/bash

[ -d "./scripts" ] || cd ..

function scrubBuild() {
	# scrub build folders
	find . -type d -name 'build' -not -path './node_modules/*' -exec rm -rf {} +
}

function scrubBuildInfo() {
	# scrub build info
	find . -type f -name 'tsconfig.tsbuildinfo' -not -path './node_modules/*' -exec rm -rf {} +
}

function scrubLogs() {
	# scrub log files
	find . -type f -name '*.log' -not -path './node_modules/*' -exec rm -rf {} +
}

function scrubPm2() {
	# scrub pm2 loaded apps
	pm2 delete all || true
}

if [ "$1" = "build" ]; then
	scrubBuild
	scrubBuildInfo

elif [ "$1" = "logs" ]; then
	scrubLogs

elif [ "$1" = "pm2" ]; then
	scrubPm2
	scrubLogs

else
	scrubBuild
	scrubLogs

fi

echo "scrub $1 done."