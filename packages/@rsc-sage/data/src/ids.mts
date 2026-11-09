import { deleteFile } from "@rsc-utils/fs-utils";
import { captureProcessExit, Logger } from "@rsc-utils/logger-utils";
import { getDuplicates, getIdsArrayFilePath, getIdsStats, writeIdsArray } from "./validation/IdsArray.js";

captureProcessExit();

async function main() {
	Logger.package("@rsc-sage/data").trace("Deleting ...");
	await deleteFile(getIdsArrayFilePath());

	Logger.package("@rsc-sage/data").trace("Writing ...");
	await writeIdsArray();

	Logger.package("@rsc-sage/data").trace("Looking for duplicates ...");
	const duplicates = getDuplicates();

	if (duplicates.length) {
		Logger.package("@rsc-sage/data").debug({duplicates});
	}

	Logger.package("@rsc-sage/data").debug(getIdsStats());
}

// make sure we don't trigger this with an index.ts include
if (process.argv[1].endsWith("ids.mjs")) {
	main();
}

/*
node ./packages/data-layer/build/ids.mjs codeName=dev dataRoot=/Users/randaltmeyer/tmp/data
*/