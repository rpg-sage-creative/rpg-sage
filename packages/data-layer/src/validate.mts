import { initializeConsoleUtilsByEnvironment } from "@rsc-utils/core-utils";
import { GlobalCache } from "./cache/GlobalCache.js";

initializeConsoleUtilsByEnvironment();

type ObjectType = typeof ObjectTypes[number];
const ObjectTypes = ["games", "messages", "servers", "users"] as const;
function isObjectType(value: unknown): value is ObjectType {
	return ObjectTypes.includes(value as ObjectType);
}

async function main() {
	const globalCache = GlobalCache.initialize();

	const objectTypeArgs = process.argv.filter(isObjectType);

	const years = ["2021", "2022", "2023", "2024", "2025", "2026"];
	const yearArgs = process.argv.filter(arg => years.includes(arg));
	if (!yearArgs.length) yearArgs.push(...years);

	for (const objectType of objectTypeArgs) {
		await globalCache.validate(objectType, yearArgs);
	}
}

// make sure we don't trigger this with an index.ts include
if (process.argv[1].endsWith("validate.mjs")) {
	main();
}