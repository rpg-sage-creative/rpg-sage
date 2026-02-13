import { initializeConsoleUtilsByEnvironment, verbose } from "@rsc-utils/core-utils";
import { processMessages } from "./updates/processMessages.js";
import { processUsers } from "./updates/processUsers.js";

initializeConsoleUtilsByEnvironment();

type ObjectType = typeof ObjectTypes[number];
const ObjectTypes = ["games", "messages", "servers", "users"] as const;
function isObjectType(value: unknown): value is ObjectType {
	return ObjectTypes.includes(value as ObjectType);
}

async function main() {
	const processors: Record<ObjectType, Function> = {
		"games": () => {},
		"messages": processMessages,
		"servers": () => {},
		"users": processUsers,
	};

	const objectTypeArgs = process.argv.filter(isObjectType);

	verbose(`Processing: ${objectTypeArgs.join(", ") || "none"}`);

	for (const objectType of objectTypeArgs) {
		await processors[objectType]();
	}
}

// make sure we don't trigger this with an index.ts include
if (process.argv[1].endsWith("process.mjs")) {
	main();
}