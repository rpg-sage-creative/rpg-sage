import { initializeConsoleUtilsByEnvironment } from "@rsc-utils/core-utils";
import { DataTable } from "./cache/DataTable.js";

initializeConsoleUtilsByEnvironment();

async function main() {
	await DataTable
		.initialize()
		.populate();
}

// make sure we don't trigger this with an index.ts include
if (process.argv[1].endsWith("app.mjs")) {
	main();
}