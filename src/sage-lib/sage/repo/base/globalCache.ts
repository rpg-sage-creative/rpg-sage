import { error, errorReturnFalse, errorReturnUndefined, getCodeName, getDataRoot, isNonNilSnowflake, isNonNilUuid, randomSnowflake, toLiteral, verbose, type Snowflake, type UUID } from "@rsc-utils/core-utils";
import { filterFiles, readJsonFile, writeFile } from "@rsc-utils/io-utils";

type CacheItemObjectType = "Game" | "Server" | "User";

/** The most basic form of global in memory cache items. */
export type GlobalCacheItem = { id:string; did?:string; uuid?:string; objectType:CacheItemObjectType; };

/** Creates an in memory cache item that is purely ids and objectType. (Mostly used for logging output.) */
function toGlobalCacheItem(item: GlobalCacheItem): GlobalCacheItem {
	const { id, did, uuid, objectType } = item;
	return { id, did, uuid, objectType };
}

/** The global in memory cache item used for Games. */
export type GameCacheItem = GlobalCacheItem & { serverDid:string; archivedTs?:number; users?:{did?:string;}[]; channels?:{id:string;did?:string;}[] };

/** Simplifies the given object to a basic form for caching in memory and still enabling some properties to be searched. */
function simplifyCacheItem<T extends GlobalCacheItem | GameCacheItem>(core: T): GlobalCacheItem | GameCacheItem {
	let {

		// GlobalCacheItem
		id, did, uuid, objectType,

		// GameCacheItem
		archivedTs, channels, serverDid, users

	} = core as GameCacheItem;

	// GameRepo does lookups by channel: id, did
	channels = channels?.map(({ id, did }) => ({ id, did }));

	// GameRepo does lookups by user: did
	users = users?.map(({ did }) => ({ did }));

	return { id, did, uuid, objectType, serverDid, archivedTs, users, channels };
}

/** Reusable function to avoid typoes when getting json file path. */
function getJsonPath(key: CacheItemKey, id: string): string {
	return `${getDataRoot(`sage/${key}`)}/${id}.json`;
}

type CacheItemKey = "games" | "servers" | "users";

type CacheKey = CacheItemObjectType | CacheItemKey;

function toCacheItemKey(value: CacheKey): CacheItemKey {
	switch(value) {
		case "Game": return "games";
		case "Server": return "servers";
		case "User": return "users";
		default: return value;
	}
}

/** This is where the magic is stored. */
const cacheMap = new Map<CacheItemKey, Map<string, GlobalCacheItem>>();

/**
 * Returns the in memory globally cached GlobalCacheItem array that matches the filter.
 * It is expected that if you need an instance of the item that you will use globalCacheRead().
*/
export function globalCacheFilter<T extends GlobalCacheItem>(key: CacheKey, filter: (core: T) => unknown): T[] {
	const cache = cacheMap.get(toCacheItemKey(key));
	if (!cache) {
		return [];
	}

	const filtered: T[] = [];

	const cores = cache.values() as MapIterator<T>;
	for (const core of cores) {
		if (filter(core)) {
			filtered.push(core);
		}
	}

	return filtered;
}

/**
 * Returns the in memory globally cached GlobalCacheItem that matches the filter.
 * It is expected that if you need an instance of the item that you will use globalCacheRead().
*/
export function globalCacheFind<T extends GlobalCacheItem>(key: CacheKey, filter: (core: T) => unknown): T | undefined {
	// make sure it is a valid cache key
	const cache = cacheMap.get(toCacheItemKey(key));
	if (!cache) {
		return undefined;
	}

	// iterate the cached items
	const cores = cache.values() as MapIterator<T>;
	for (const core of cores) {
		if (filter(core)) {
			return core;
		}
	}

	return undefined;
}

/**
 * Returns the in memory globally cached GlobalCacheItem by key and id.
 * It is expected that if you need an instance of the item that you will use globalCacheRead().
 */
export function globalCacheGet<T extends GlobalCacheItem>(key: CacheKey, id: string): T | undefined {
	return cacheMap.get(toCacheItemKey(key))?.get(id) as T;
}

/**
 * Reads the cached item's file source to ensure we have a fresh copy of the item.
 * @todo for a ddbrepo this should fetch instead of readJsonFile
 */
export async function globalCacheRead<T extends GlobalCacheItem>(item: GlobalCacheItem): Promise<T | undefined> {
	const key = toCacheItemKey(item.objectType);

	if (!item.id && !item.did && !item.uuid) {
		error(`globalCacheRead(${toLiteral(key)}, ${toLiteral(toGlobalCacheItem(item))})`);
		return undefined;
	}

	// read by id first
	let json = await readJsonFile<T>(getJsonPath(key, item.id)).catch(() => undefined);

	// read by did if id missed
	if (!json && item.did) {
		json = await readJsonFile<T>(getJsonPath(key, item.did)).catch(() => undefined);
	}

	// read by uuid id id and did missed
	if (!json && item.uuid) {
		json = await readJsonFile<T>(getJsonPath(key, item.uuid)).catch(() => undefined);
	}

	return json ?? undefined;
}

/**
 * Reads the json at the given path and updates the in memory global cache.
 * @todo for a ddbrepo this should fetch instead of readJsonFile
 */
async function readAndCache(cache: Map<string, GlobalCacheItem>, path: string): Promise<boolean> {
	// read it
	let json = await readJsonFile<GlobalCacheItem>(path).catch(errorReturnUndefined);
	if (!json) {
		return false;
	}

	// simplify it for the cache (to reduce memory usage)
	json = simplifyCacheItem(json);

	// cache it by all ids
	if (json?.id) cache.set(json.id, json);
	if (json?.did) cache.set(json.did, json);
	if (json?.uuid) cache.set(json.uuid, json);

	return true;
}

/**
 * Populates the in memory cache layer for the given key (games, servers, users).
 * @todo not sure if i even want to do this for ddbrepo ...
 */
export async function globalCachePopulate(key: CacheKey): Promise<boolean> {
	const cacheItemKey = toCacheItemKey(key);

	// add the map if needed
	if (!cacheMap.has(cacheItemKey)) {
		cacheMap.set(cacheItemKey, new Map());
	}

	// get the map
	const cache = cacheMap.get(cacheItemKey)!;

	// iterate the json files and load cache data into memory
	const path = getDataRoot(`sage/${key}`);
	const files = await filterFiles(path, { fileExt:"json" });
	for (const file of files) {
		const bool = await readAndCache(cache, file);
		if (!bool) {
			error({ key, path });
			return false;
		}
	}

	// send to the logs so we can see if something is amiss
	verbose({ key, path, files:files.length, keys:cache.size });

	return true;
}

// makes sure we don't have an invalid value for the id
function ensureNonNilId({ id, did, uuid }: GlobalCacheItem): Snowflake | UUID | undefined {
	if (isNonNilUuid(id)) return id;
	if (isNonNilSnowflake(id)) return id;
	if (isNonNilSnowflake(did)) return did;
	if (isNonNilUuid(uuid)) return uuid;
	return undefined;
}

/**
 * Writes the updated item to disk *AND THEN* updates the in memory cache.
 * @todo for a ddbrepo this should put instead of writeFile
 */
export async function globalCachePut<T extends GlobalCacheItem>(item: T): Promise<boolean> {
	const key = toCacheItemKey(item.objectType);

	// ensure we have a valid type and cache map
	const cache = cacheMap.get(key);
	if (!cache) {
		error({ objectType:item.objectType, key });
		return false;
	}

	// ensure this item has an id
	let itemId = ensureNonNilId(item);
	if (!itemId) {
		/** @todo when can i ensure this will never be called !? */
		error(`globalCachePut(${toLiteral(key)}, ${toLiteral(toGlobalCacheItem(item))})`);
		itemId = randomSnowflake();
		item.id = itemId;
	}

	// write to file using the first id found (should be .id)
	const path = getJsonPath(key, itemId);
	const saved = await writeFile(path, item, { makeDir:true, formatted:getCodeName() === "dev" }).catch(errorReturnFalse);
	if (!saved) {
		return false;
	}

	// rereads and caches the newly written file to ensure our in memory object is clean, fresh, and unspoiled
	return readAndCache(cache, path);
}