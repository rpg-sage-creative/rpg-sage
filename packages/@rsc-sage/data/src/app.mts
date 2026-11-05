import { captureProcessExit } from "@rsc-utils/logger-utils";
import { DataTable } from "./cache/DataTable.js";

captureProcessExit();

async function main() {
	await DataTable
		.initialize()
		.populate();
}

// make sure we don't trigger this with an index.ts include
if (process.argv[1].endsWith("app.mjs")) {
	main();
}