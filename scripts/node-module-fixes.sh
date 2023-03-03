# bring in the NPM libs
[ -f "./inc/npm.sh" ] && source "./inc/npm.sh" || source "./scripts/inc/npm.sh"

# check NPM libs and install missing ones
checkNpmLibs "true"

# we have a known issue with this lib needing this "declare module"
if [ ! -f "./node_modules/pdf2json/index.d.ts" ]; then
	echo "Creating: ./node_modules/pdf2json/index.d.ts";
	rm -rf ./node_modules/pdf2json/index.d.ts
	echo 'declare module "pdf2json";' > ./node_modules/pdf2json/index.d.ts
fi
