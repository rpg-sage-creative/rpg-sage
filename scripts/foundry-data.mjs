import { readdirSync, readFileSync, writeFileSync } from "fs";

const foundrySource = "/Users/randaltmeyer/git/pf2e/packs";
const dataRootFoundry = "/Users/randaltmeyer/git/rpg-sage/data/foundry";

const sources = new Set();

console.log(`Getting types ...`);
const types = readdirSync(foundrySource).filter(path => !path.includes("."));
console.log(`              ... done.`);

for (const type of types) {
	const list = [];

	console.log(`Reading type (${type}) ...`);
	const typePath = `${foundrySource}/${type}`;
	const files = readdirSync(typePath).filter(file => file.endsWith(".json"));
	for (const file of files) {
		const filePath = `${typePath}/${file}`;
		const raw = readFileSync(filePath).toString();
		const json = JSON.parse(raw);
		list.push(JSON.stringify(json));
	}

	const outFilePath = `${dataRootFoundry}/${type}.json.db`;
	console.log(`Writing file (${outFilePath}) ...`);
	writeFileSync(outFilePath, list.join("\n"))
}

const out = Array.from(sources).sort().join("\n");
writeFileSync(`${dataRootFoundry}/foundry-sources.txt`, out);
