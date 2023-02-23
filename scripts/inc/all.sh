#region functions

# convenience method to show my command and execute it
outputToScript="false"
function echoAndDo() {
	if [ "$outputToScript" = "true" ]; then
		echo "$1" >> output.sh
	else
		echo "$1"
		eval "$1"
	fi
}

function echoLog() {
	if [ "$outputToScript" = "true" ]; then
		echo "echo \"$1\"" >> output.sh
	else
		echo "$1"
	fi
}

# convenience method to including (sourcing) other scripts
function include() {
	if [ ! -z "$1" ]; then
		local incPaths=("./$1.sh" "./inc/$1.sh" "./scripts/inc/$1.sh")
		for incPath in "${incPaths[@]}"; do
			if [ -f "$incPath" ]; then
				source "$incPath"
			fi
		done
	fi
}

# convenience method to upload a file via scp
function scpTo() {
	localPath="$1"
	remotePath="$2"
	echoAndDo "scp $sshKey $localPath $sshHost:$remotePath"
}

# convenience method to download a file via scp
function scpFrom() {
	remotePath="$1"
	localPath="$2"
	echoAndDo "scp $sshKey $sshHost:$remotePath $localPath"
}

function sshRun() {
	sshCommand=""

	# If going to dev, source the shell
	if [ "$ENV" = "mini" ]; then
		sshCommand="source ~/.zshrc;"
	fi

	# combine all other args into a single command
	sshCommands=("$@")
	for cmd in "${sshCommands[@]}"; do
		sshCommand="$sshCommand echo \\\"$cmd\\\"; eval \\\"$cmd\\\";"
	done

	# include an exit
	sshCommand="$sshCommand exit;"

	echoAndDo "ssh $sshHost $sshKey \"$sshCommand\""
}

#endregion

#region npm lib versions: CHANGE ONLY AS REQUIRED

#region local npm libs for DEV only

NODE_TYPES_NPM="@types/node@18.14.0"
NODE_TYPES_FOLLOW_REDIRECTS="@types/follow-redirects@1.14.1"

#endregion

#region npm libs for DEPLOY

DISCORD_NPM="discord.js@13.12.0"
XREGEXP_NPM="xregexp@5.1.1"
CANVAS_NPM="@napi-rs/canvas@0.1.35"
PDF2JSON_NPM="pdf2json@3.0.2"
EMOJI_REGEX_NPM="emoji-regex@10.2.1"
FOLLOW_REDIRECTS_NPM="follow-redirects@1.15.2"

#endregion

#endregion

#region global "dir" vars

# Dir where this file is located
incDir="$(cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd)"

# Dir where the scripts files are
scriptsDir="$(dirname -- "$incDir")"

# Get Sage root folder (parent of the scripts folder containing config.sh)
sageRoot="$(basename $(dirname -- "$scriptsDir"))"
sageRootDir="$(dirname -- "$scriptsDir")"

# Dir where we are running this file from
currentDir="$(pwd)"

# local sage data dir
cloudSageDataDir="/Users/randaltmeyer/Library/Mobile\ Documents/com~apple~CloudDocs/code/sage-data"

# local sage data backup dir
backupDir="$cloudSageDataDir/backup"

#endregion

#region ACT / ENV / PKG switches and includes

# get the action, environment, and package args/flags
ACT=
ENV=
PKG=
while test $# -gt 0; do
	case "$1" in
		start|stop|delete|restart) ACT="$1"; shift; ;;
		aws|local|mini|vps) ENV="$1"; shift; ;;
		data|dev|beta|stable) PKG="$1"; shift; ;;
		-script) outputToScript="true"; shift; ;;
		*) break; ;;
	esac
done

# prep output script
if [ "$outputToScript" = "true" ]; then
	rm -rf output.sh
fi

# include the environment and package based args
include "$ENV"
include "$PKG"

#endregion
