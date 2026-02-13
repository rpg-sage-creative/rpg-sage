import { initializeConsoleUtilsByEnvironment } from "@rsc-utils/core-utils";
import { GlobalCache } from "./cache/GlobalCache.js";

initializeConsoleUtilsByEnvironment();

async function main() {
	const globalCache = GlobalCache.initialize();
	await globalCache.populate("servers");
	await globalCache.populate("games");
	await globalCache.populate("users");
}

// make sure we don't trigger this with an index.ts include
if (process.argv[1].endsWith("app.mjs")) {
	main();
}