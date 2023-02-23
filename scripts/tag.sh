#!/bin/bash

# import constants and functions
[ -f "./inc/all.sh" ] && source "./inc/all.sh" || source "./scripts/inc/all.sh"

# Don't run if we are in sageRoot folder or we don't have .git folder
if [ "$currentApp" != "$sageRoot" ] && [ -d "./.git" ]; then
	# Syntax: /bin/bash tag.sh '1.0.0' 'Description'
	version="$1"
	description="$2"
	versionPattern="^[0-9]+.[0-9]+.[0-9]+$"
	if [ -z "$version" ] || [ -z "$description" ] || [[ ! $version =~ $versionPattern ]]; then
		echo "Invalid tag data: (ticks added)"
		echo "  version: '$version'"
		echo "  description: '$description'"
		echo "VERSION MUST BE: major.minor.revision --> 1.2.3"
		echo "Syntax: /bin/bash tag.sh '1.0.0' 'Description'"
	else
		echoAndDo "git tag -a v$1 -m '$2'"
		echoAndDo "git push --tags"
	fi
else
	echo "Invalid git repo: $currentApp"
fi
