import { indexTs } from "./indexTs.mjs";
import { testJs } from "./testJs.mjs";
import { parseArgs, parseFlags, parsePairs } from "./util/index.mjs";
import { version } from "./version.mjs";

async function runCommand() {
	/** @type {string} */
	const command = process.argv[2];

	const input = process.argv.slice(3);
	const args = parseArgs(input);
	const pairs = parsePairs(input);
	const flags = parseFlags(input);
	const options = { ...pairs, ...flags };

	try {
		switch(command) {
			case "indexTs":
				return indexTs(args, options);
			case "testJs":
				return testJs(args, options);
			case "version":
				return version(args, options);
			default:
				console.error(`Invalid command: ${command}`);
				console.log({command,args,options});
				process.exit(1);
		}
	}catch(ex) {
		console.error(`Unhandled Exception processing: ${command}`);
		console.log({command,args,options});
		console.error(ex);
		process.exit(1);
	}
}

runCommand();
