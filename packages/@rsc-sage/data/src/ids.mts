import { debug, initializeConsoleUtilsByEnvironment, trace } from "@rsc-utils/core-utils";
import { deleteFile } from "@rsc-utils/io-utils";
import { getDuplicates, getIdsArrayFilePath, getIdsStats, writeIdsArray } from "./validation/IdsArray.js";

initializeConsoleUtilsByEnvironment();

async function main() {
	trace("Deleting ...");
	await deleteFile(getIdsArrayFilePath());

	trace("Writing ...");
	await writeIdsArray();

	trace("Looking for duplicates ...");
	const duplicates = getDuplicates();

	if (duplicates.length) {
		debug({duplicates});
	}

	debug(getIdsStats());
}

// make sure we don't trigger this with an index.ts include
if (process.argv[1].endsWith("ids.mjs")) {
	main();
}

/*
node ./packages/data-layer/build/ids.mjs codeName=dev dataRoot=/Users/randaltmeyer/tmp/data
*/