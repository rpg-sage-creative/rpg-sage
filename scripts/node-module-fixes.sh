
# we have a known issue with this lib needing this "declare module"
if [ ! -f "./node_modules/pdf2json/index.d.ts" ]; then
	echo "Creating: ./node_modules/pdf2json/index.d.ts";
	echo 'declare module "pdf2json";' > ./node_modules/pdf2json/index.d.ts
fi
