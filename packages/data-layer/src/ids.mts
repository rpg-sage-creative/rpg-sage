import { initializeConsoleUtilsByEnvironment } from "@rsc-utils/core-utils";
import { deleteFile } from "@rsc-utils/io-utils";
import { getIdsArrayFilePath, writeIdsArray } from "./validation/IdsArray.js";

initializeConsoleUtilsByEnvironment();

async function main() {
	await deleteFile(getIdsArrayFilePath());
	await writeIdsArray();
}

// make sure we don't trigger this with an index.ts include
if (process.argv[1].endsWith("ids.mjs")) {
	main();
}

/*
node ./packages/data-layer/build/ids.mjs codeName=dev dataRoot=/Users/randaltmeyer/tmp/data
*/