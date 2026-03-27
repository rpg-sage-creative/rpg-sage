import { debug, getDataRoot, noop, parseSnowflake, parseUuid, verbose, type Snowflake, type UUID } from "@rsc-utils/core-utils";
import { listFiles, readJsonFile, writeFile } from "@rsc-utils/io-utils";
import { join } from "node:path";
import type { SageCharacterCore } from "../types/SageCharacterCore.js";

const ObjectTypes = ["bots", "characters", "e20", "games", "heph", "maps", "pb2e", "servers", "users"];

type Ids = { id:string; did?:Snowflake; uuid?:UUID; };
type Core = Ids & { objectType?:string; };

let map: Map<string, Ids> | undefined;

function pushIds(core: Core) {
	if (core.uuid === "da9219b9-6933-4c55-96dd-702fbc4bd614") debug({core});
	map ??= new Map();

	const uuid = parseUuid(core.uuid) ?? parseUuid(core.id);
	const did = parseSnowflake(core.did) ?? parseSnowflake(core.id);
	const id = did ?? uuid ?? core.id;
	const ids = { id, did, uuid };

	if (id) {
		if (map.has(id) && JSON.stringify(ids) !== JSON.stringify(map.get(id))) {
			debug(`Mismatched ${core.objectType} Ids (id): `, ids, map.get(id));
		}
		map.set(id, ids);
	}else {
		debug(`Invalid Core: `, core);
		return;
	}

	if (did) {
		if (map.has(did) && JSON.stringify(ids) !== JSON.stringify(map.get(did))) {
			debug(`Mismatched ${core.objectType} Ids (did): `, ids, map.get(did));
		}
		map.set(did, ids);
	}

	if (uuid) {
		if (map.has(uuid) && JSON.stringify(ids) !== JSON.stringify(map.get(uuid))) {
			debug(`Mismatched ${core.objectType} Ids (uuid): `, ids, map.get(uuid));
		}
		map.set(uuid, ids);
	}
}

async function buildIdMap() {
	verbose(`Building id-map.json`);
	map = new Map();

	const root = getDataRoot("sage");
	const allDirs = await listFiles(root);
	const dirs = allDirs.filter(dir => ObjectTypes.includes(dir));

	for (const dir of dirs) {
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
			pushIds(json);
			// process characters from games, servers, and users
			if ("gmCharacter" in json) {
				pushIds(json.gmCharacter as SageCharacterCore);
				(json.gmCharacter as SageCharacterCore)?.companions?.forEach(pushIds);
			}
			if ("nonPlayerCharacters" in json) {
				(json.nonPlayerCharacters as SageCharacterCore[]).forEach(pc => {
					pushIds(pc);
					pc.companions?.forEach(pushIds);
				});
			}
			if ("playerCharacters" in json) {
				(json.playerCharacters as SageCharacterCore[]).forEach(pc => {
					pushIds(pc);
					pc.companions?.forEach(pushIds);
				});
			}
		}
	}

	const idSet = new Set<string>();
	for (const ids of map.values()) {
		idSet.add(ids.id);
	}
	const idsArray: Ids[] = [];
	for (const id of idSet) {
		idsArray.push(map.get(id)!);
	}
	verbose(`Writing id-map.json ...`);
	await writeFile(getIdMapFilePath(), idsArray);
}

export async function getIdMap() {
	if (!map) {
		verbose("Opening id-map.json ...");
		const idsArray = await readJsonFile<Ids[]>(getIdMapFilePath()).catch(noop);
		if (idsArray?.length) {
			verbose("Reading id-map.json ...");
			idsArray.forEach(pushIds);
		}else {
			await buildIdMap();
		}
		verbose("                    ... done.");
	}
	return map!;
}

export function getIdMapFilePath() {
	return join(getDataRoot("sage"), "id-map.json");
}