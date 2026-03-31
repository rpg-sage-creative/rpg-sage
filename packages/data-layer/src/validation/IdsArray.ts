import { debug, getDataRoot, isDefined, noop, parseSnowflake, parseUuid, toUnique, verbose, type Snowflake, type UUID } from "@rsc-utils/core-utils";
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
type Core<Type extends string = ObjectType> = Ids & { objectType:Type; };
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

export function findIds<Type extends string>(core: Core<Type>) {
	return idsArray.find(other => coresMatch(core as Core<ObjectType>, other));
}

function idsMatch(a: Ids, b: Ids) {
	const aIds = [a.id.toLowerCase(), a.did?.toLowerCase(), a.uuid?.toLowerCase()].filter(isDefined);
	const bIds = [b.id.toLowerCase(), b.did?.toLowerCase(), b.uuid?.toLowerCase()].filter(isDefined);
	return aIds.some(aId => bIds.includes(aId));
}

function coresMatch(a: Core, b: Core) {
	return a.objectType === b.objectType && idsMatch(a, b);
}

export function getFilePaths<Type extends string>(core: Core<Type>) {
	return idsArray
		.filter(other => other.filePath && coresMatch(core as Core<ObjectType>, other))
		.map(other => other.filePath!)
		.filter(toUnique);
}

export function getDuplicates() {
	return idsArray.filter(ids => {
		return getFilePaths(ids).length > 1;
	});
}