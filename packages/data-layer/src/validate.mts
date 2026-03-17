import { initializeConsoleUtilsByEnvironment } from "@rsc-utils/core-utils";
import { validate } from "./cache/internal/validate.js";
import { type CacheItemObjectType, isCacheItemObjectType, isCacheItemTableName, tableNameToObjectType } from "./cache/types.js";

initializeConsoleUtilsByEnvironment();

async function main() {
	// const globalCache = GlobalCache.initialize();

	const objectTypes = new Set<CacheItemObjectType>();

	process.argv.forEach(arg => {
		if (isCacheItemObjectType(arg)) objectTypes.add(arg);
		if (isCacheItemTableName(arg)) objectTypes.add(tableNameToObjectType(arg));
	});

	const years = ["2021", "2022", "2023", "2024", "2025", "2026"];
	const yearArgs = process.argv.filter(arg => years.includes(arg));
	if (!yearArgs.length) yearArgs.push(...years);

	for (const objectType of objectTypes) {
		await validate(objectType, yearArgs);
	}
}

// make sure we don't trigger this with an index.ts include
if (process.argv[1].endsWith("validate.mjs")) {
	main();
}