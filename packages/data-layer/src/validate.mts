import { initializeConsoleUtilsByEnvironment, verbose } from "@rsc-utils/core-utils";
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

	verbose(`Validating: ${objectTypeArgs.join(", ") || "none"}`);

	for (const objectType of objectTypeArgs) {
		await globalCache.validate(objectType);
	}
}
main();