import { debug, getDataRoot, noop, parseSnowflake, parseUuid, toUnique, verbose, type Snowflake, type UUID } from "@rsc-utils/core-utils";
import { listFiles, readJsonFile, writeFile } from "@rsc-utils/io-utils";
import { join } from "node:path";
import type { SageCharacterCore } from "../types/SageCharacterCore.js";

const ObjectTypes = ["Bot", "Character", "E20", "Game", "Heph", "Map", "PB2e", "Server", "User"] as const;
type ObjectType = typeof ObjectTypes[number];
const DirNames = ["bots", "characters", "e20", "games", "heph", "maps", "pb2e", "servers", "users"] as const;
type DirName = typeof DirNames[number];

function objectTypeToDirName(objectType: ObjectType): DirName {
	const index = ObjectTypes.indexOf(objectType);
	return DirNames[index];
}

type Ids = { id:string; did?:Snowflake; uuid?:UUID; };
type Core = Ids & { objectType:ObjectType; };
type ArrayCore = Core & { filePath?:string; };

const idsArray: ArrayCore[] = [];

function pushIds(core: Core, filePath?: string) {
	if (!core.objectType) {
		debug(`Invalid Core: `, core);
		return;
	}

	const id = parseUuid(core.id) ?? parseSnowflake(core.id);
	if (!id) {
		if (core.objectType !== "Character") {
			debug(`Invalid Core: `, core);
		}
		return;
	}

	const did = parseSnowflake(core.did);
	const uuid = parseUuid(core.uuid);
	idsArray.push({ id, did, uuid, objectType:core.objectType, filePath });
}

function pushCharIds({ id, did, uuid }: Core, _parent?: Core) {
	pushIds({ id, did, uuid, objectType:"Character" });
}

/** populate array from objects */
export async function populateIdsArray(objectTypeArgs?: ObjectType[]) {
	if (idsArray.length) return false;

	verbose(`Populating ids-array.json`);

	const root = getDataRoot("sage");

	for (const objectType of ObjectTypes) {
		if (objectTypeArgs && !objectTypeArgs.includes(objectType)) continue;
		const dir = objectTypeToDirName(objectType);
		verbose(`Mapping Ids from ${dir} ...`);
		const path = join(root, dir);
		const files = await listFiles(path, "json");
		for (const fileName of files) {
			const filePath = join(path, fileName);
			const json = await readJsonFile<Core>(filePath);
			if (!json) {
				debug("invalid file: " + filePath);
				continue;
			}
			pushIds({ id:json.id, did:json.did, uuid:json.uuid, objectType }, filePath);
			// process characters from games, servers, and users
			if ("gmCharacter" in json) {
				pushCharIds(json.gmCharacter as SageCharacterCore, json);
				(json.gmCharacter as SageCharacterCore)?.companions?.forEach(c => pushCharIds(c, json));
			}
			if ("nonPlayerCharacters" in json) {
				(json.nonPlayerCharacters as SageCharacterCore[]).forEach(pc => {
					pushCharIds(pc, json);
					pc.companions?.forEach(c => pushCharIds(c, json));
				});
			}
			if ("playerCharacters" in json) {
				(json.playerCharacters as SageCharacterCore[]).forEach(pc => {
					pushCharIds(pc, json);
					pc.companions?.forEach(c => pushCharIds(c, json));
				});
			}
		}
	}

	return true;
}

/** write ids array to file */
export async function writeIdsArray() {
	const populated = await populateIdsArray();

	if (!populated) return false;

	verbose(`Writing ids-array.json ...`);

	await writeFile(getIdsArrayFilePath(), idsArray);

	return true;
}

/** read ids array from file */
export async function readIdsArray() {
	if (idsArray.length) return false;

	verbose("Opening ids-array.json ...");

	const cores = await readJsonFile<Core[]>(getIdsArrayFilePath()).catch(noop);

	if (!cores?.length) return false;

	verbose("Reading ids-array.json ...");

	cores.forEach(core => pushIds(core));

	verbose("                    ... done.");

	return true;
}

export function getIdsArrayFilePath() {
	return join(getDataRoot("sage"), "ids-array.json");
}

export function findId(id: string, objectType?: string) {
	for (const ids of idsArray) {
		if (ids.id === id || ids.did === id || ids.uuid === id) {
			if (!objectType || ids.objectType === objectType) {
				return ids;
			}
		}
	}
	return undefined;
}

export function getFilePaths(ids: Ids & { objectType:string; }) {
	const id = ids?.id.toLowerCase();
	const did = ids?.did?.toLowerCase();
	const uuid = ids?.uuid?.toLowerCase();
	const objectType = ids?.objectType;
	return idsArray.filter(ids => {
		if (!ids.filePath) return false;
		if (ids.objectType !== objectType) return false;
		return (id && (ids.id === id || ids.did === id || ids.uuid === id)) || (did && ids.did === did) || (uuid && ids.uuid === uuid);
	})
	.map(ids => ids.filePath!)
	.filter(toUnique);
}