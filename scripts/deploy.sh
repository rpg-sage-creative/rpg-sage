#!/bin/bash

NOW=`date '+%F-%H%M'`;

# import constants and functions
[ -f "./inc/all.sh" ] && source "./inc/all.sh" || source "./scripts/inc/all.sh"

# warn if any args are missing
if [ -z "$ENV" ] || [ -z "$PKG" ] || [ "$PKG" = "maps" ]; then
	echoLog "/bin/bash deploy.sh dev|beta|stable|data aws|docker"
	exit 1
fi

# other dir vars
deployDirRemote="$botDir/deploy"
deployDirLocal="$sageRootDir/deploy"

#region setup deploy folder, zip deployment, deploy it, and delete local deployment

if [ "$PKG" = "data" ]; then
	echoAndDo "rm -rf $deployDirLocal; mkdir $deployDirLocal"

	# build a tmp deploy folder
	echoAndDo "mkdir $deployDirLocal/tmp; cd $deployDirLocal/tmp"

	# add files that need to get deployed
	echoAndDo "echo 'VERSION' >> version.txt"
	echoAndDo "echo 'v1.?.?' >> version.txt"
	echoAndDo "echo '' >> version.txt"
	echoAndDo "echo 'DATE' > version.txt"
	echoAndDo "echo '$NOW' >> version.txt"
	echoAndDo "echo '' >> version.txt"
	echoAndDo "echo 'BRANCH' >> version.txt"
	echoAndDo "git branch --show-current >> version.txt"
	echoAndDo "echo '' >> version.txt"
	echoAndDo "echo 'COMMIT' >> version.txt"
	echoAndDo "git log -n 1 --pretty=oneline >> version.txt"
	echoAndDo "echo 'ver 0.0.0' > sage-data-pf2e.ver"
	echoAndDo "cp -r $sageRootDir/data/pf2e/dist/* $deployDirLocal/tmp"

	# zip deployment files
	echoAndDo "zip -rq9 $deployDirLocal/$PKG.zip *"

	# stage files in remote deploy folder
	scpTo "$deployDirLocal/$PKG.zip" "$deployDirRemote/$PKG.zip"

	# remove local deploy
	echoAndDo "rm -rf $deployDirLocal"

	# execute the deploy script on the remote
	sshCommands=(
		"mv $packageDir/pf2e/dist $packageDir/pf2e/dist-$NOW"
		"unzip -q $deployDirRemote/data -d $packageDir/pf2e/dist"
		"rm -f $deployDirRemote/data.zip"
		"pm2 desc sage-dev-$ENV >/dev/null && pm2 restart sage-dev-$ENV"
		"pm2 desc sage-beta-$ENV >/dev/null && pm2 restart sage-beta-$ENV"
		"pm2 desc sage-stable-$ENV >/dev/null && pm2 restart sage-stable-$ENV"
	)

else

	packageDirTmp="$packageDir-tmp"
	packageDirOld="$packageDir-$NOW"
	mapsDelete=""
	mapsStart=""
	if [ "$PKG" = "stable" ]; then
		mapsDelete="pm2 desc sage-maps-$ENV >/dev/null && pm2 delete sage-maps-$ENV"
		mapsStart="pm2 start map.mjs --name sage-maps-$ENV --max-memory-restart 500M --node-args='--experimental-modules --es-module-specifier-resolution=node' -- $PKG"
	fi
	sshCommands=(
		"git clone git@github.com:randaltmeyer/rpg-sage-legacy.git $packageDirTmp"
		"cd $packageDirTmp"
		"npm install"
		"rm -rf ./node_modules/pdf2json/index.d.ts"
		"[ ! -f './node_modules/pdf2json/index.d.ts' ] && echo 'declare module "pdf2json";' > ./node_modules/pdf2json/index.d.ts"
		"tsc --build tsconfig.json"
		"pm2 desc sage-$PKG-$ENV >/dev/null && pm2 delete sage-$PKG-$ENV"
		"$mapsDelete"
		"mv $packageDir $packageDirOld"
		"mv $packageDirTmp $packageDir"
		"cd $packageDir"
		"pm2 start bot.mjs --name sage-$PKG-$ENV --max-memory-restart 750M --node-args='--experimental-modules --es-module-specifier-resolution=node' -- $PKG dist"
		"$mapsStart"
		"pm2 save"
	)

fi
sshRun "${sshCommands[@]}"


#endregion





rm -rf $target
git clone git@github.com:randaltmeyer/rpg-sage-legacy.git $target