if [ ! -f "./node_modules/pdf2json/index.d.ts" ]; then
	echo "Creating: ./node_modules/pdf2json/index.d.ts";
	rm -rf ./node_modules/pdf2json/index.d.ts
	echo 'declare module "pdf2json";' > ./node_modules/pdf2json/index.d.ts
fi
