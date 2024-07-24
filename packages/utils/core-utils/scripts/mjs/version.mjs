import { readFileSync, writeFileSync } from "fs";
import { incrementVersion } from "./util/index.mjs";

/**
 * @param {string[]} args
 * @param {{ major?:boolean; minor?:boolean; patch?:boolean; dry?:boolean }} options
 */
export function version(args, options) {
	const type = ["major","minor","patch"].find(t => options[t] || args.includes(t));
	const dry = options.dry ?? args.includes("dry");
	if (!type) {
		console.debug({args,options});
		console.error(`\tInvalid type version type!`);
		if (!dry) process.exit(1);
	}
	const pkg = JSON.parse(readFileSync("./package.json").toString());
	const vUpdated = incrementVersion(pkg.version, type);
	if (!dry) {
		pkg.version = vUpdated;
		writeFileSync("./package.json", JSON.stringify(pkg, (_, value) => value, "\t"));
	}
	console.log(vUpdated);
}