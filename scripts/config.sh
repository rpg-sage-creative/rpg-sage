#region npm lib versions: CHANGE ONLY AS REQUIRED

NODE_TYPES_VER="17.0.16"
DISCORD_VER="13.10.2"
XREGEXP_VER="5.1.0"
CANVAS_VER="0.1.30"
PDF2JSON_VER="2.0.1"
FOLLOW_REDIRECTS_VER="1.15.2"

#region npm lib names/versions

NODE_TYPES_NPM="@types/node@$NODE_TYPES_VER"
DISCORD_NPM="discord.js@$DISCORD_VER"
XREGEXP_NPM="xregexp@$XREGEXP_VER"
CANVAS_NPM="@napi-rs/canvas@$CANVAS_VER"
PDF2JSON_NPM="pdf2json@$PDF2JSON_VER"
FOLLOW_REDIRECTS_NPM="follow-redirects@$FOLLOW_REDIRECTS_VER"

#endregion

#endregion

# ssh connection
sshHostRemote="rpg_sage@ps617614.dreamhostps.com"
sshHostDev="Ladnar-Mini.local"

#region remote folders

# remote
botDirRemote="/home/rpg_sage/bot"
dataDirRemote="$botDirRemote/data"
deployDirRemote="$botDirRemote/deploy"

# dev
botDirDev="~/rpg-sage"
dataDirDev="$botDirDev/data"
deployDirDev="$botDirDev/deploy"

cloudSageDataDir="~/Library/Mobile\ Documents/com~apple~CloudDocs/code/sage-data"

#endregion

# Dir where this file is located
scriptDir="$(cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd)"

# Get Sage root folder (parent of the scripts folder containing config.sh)
sageRoot="$(basename $(dirname -- "$scriptDir"))"
sageRootDir="$(dirname -- "$scriptDir")"

# Set data folders
backupDir="$cloudSageDataDir/backup"

# Dir where we are running this file from
currentDir="$(pwd)"

# convenience method to show my command and execute it
function echoAndDo() {
	cmd="$1"
	echo "$cmd"
	eval "$cmd"
}
