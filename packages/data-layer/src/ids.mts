import { debug, getDataRoot, initializeConsoleUtilsByEnvironment, parseSnowflake, parseUuid, verbose, type Snowflake, type UUID } from "@rsc-utils/core-utils";
import { listFiles, readJsonFile, writeFile } from "@rsc-utils/io-utils";
import { join } from "node:path";

initializeConsoleUtilsByEnvironment();

const ObjectTypes = ["bots", "characters", "dice", "e20", "games", "heph", "maps", "pb2e", "servers", "users"] as const;
type ObjectType = typeof ObjectTypes[number];
function isObjectType(value: unknown): value is ObjectType {
	return ObjectTypes.includes(value as ObjectType);
}

type Ids = { id:string; did?:Snowflake; uuid?:UUID; };

async function main() {
	const map = new Map<string, Ids[]>();
	const pushIds = (dir:string, core: Ids) => {
		const array = map.get(dir)!;
		const uuid = parseUuid(core.uuid) ?? parseUuid(core.id);
		const did = parseSnowflake(core.did) ?? parseSnowflake(core.id);
		const id = did ?? uuid ?? core.id;
		array.push({ id, did, uuid });
	};

	const objectTypeArgs = process.argv.filter(isObjectType);
	const filter = objectTypeArgs.length
		? (dir: string) => objectTypeArgs.includes(dir as ObjectType)
		: (dir: string) => dir !== "messages" && dir !== "logs" && !dir.includes(".");

	const root = getDataRoot("sage");
	const allDirs = await listFiles(root);
	const dirs = allDirs.filter(filter);

	for (const dir of dirs) {
		verbose(`Mapping Ids: ${dir}`);
		map.set(dir, []);
		const path = join(root, dir);
		const files = await listFiles(path, "json");
		for (const fileName of files) {
			const filePath = join(path, fileName);
			const json = await readJsonFile<Ids>(filePath);
			if (json) pushIds(dir, json);
			else debug("invalid file: " + filePath)
		}
	}

	const json = {} as Record<string, Ids[]>;
	for (const key of map.keys()) {
		json[key] = map.get(key)!;
	}
	await writeFile("./id-map.json", json);
}

// make sure we don't trigger this with an index.ts include
if (process.argv[1].endsWith("ids.mjs")) {
	main();
}