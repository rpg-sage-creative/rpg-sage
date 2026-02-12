import { initializeConsoleUtilsByEnvironment } from "@rsc-utils/core-utils";
import { GlobalCache } from "./cache/GlobalCache.js";

initializeConsoleUtilsByEnvironment();

async function main() {
	const globalCache = GlobalCache.initialize();
	await globalCache.populate("servers");
	await globalCache.populate("games");
	await globalCache.populate("users");
}
main();