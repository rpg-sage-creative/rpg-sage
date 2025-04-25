import { error, errorReturnFalse, errorReturnUndefined, getCodeName, getDataRoot, randomSnowflake, toLiteral, verbose } from "@rsc-utils/core-utils";
import { filterFiles, readJsonFile, writeFile } from "@rsc-utils/io-utils";

/** The most basic form of global in memory cache items. */
export type GlobalCacheItem = { id:string; did?:string; uuid?:string; objectType:string; };

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
function getJsonPath(key: string, id: string): string {
	return `${getDataRoot(`sage/${key}`)}/${id}.json`;
}

/** This is where the magic is stored. */
const cacheMap = new Map<string, Map<string, GlobalCacheItem>>();

/**
 * Returns the in memory globally cached GlobalCacheItem array that matches the filter.
 * It is expected that if you need an instance of the item that you will use globalCacheRead().
*/
export function globalCacheFilter<T extends GlobalCacheItem>(key: string, filter: (core: T) => unknown): T[] {
	const cache = cacheMap.get(key);
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
export function globalCacheFind<T extends GlobalCacheItem>(key: string, filter: (core: T) => unknown): T | undefined {
	// make sure it is a valid cache key
	const cache = cacheMap.get(key);
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
export function globalCacheGet<T extends GlobalCacheItem>(key: string, id: string): T | undefined {
	return cacheMap.get(key)?.get(id) as T;
}

/** Reads the cached item's file source to ensure we have a fresh copy of the item. */
export async function globalCacheRead<T extends GlobalCacheItem>(item: GlobalCacheItem): Promise<T | undefined> {
	const key = item.objectType.toLowerCase() + "s";
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

/** Reads the json at the given path and updates the in memory global cache. */
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

/** Populates the in memory cache layer for the given key (games, servers, users). */
export async function globalCachePopulate(key: string): Promise<boolean> {
	// add the map if needed
	if (!cacheMap.has(key)) {
		cacheMap.set(key, new Map());
	}

	// get the map
	const cache = cacheMap.get(key)!;

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

/** Writes the updated item to disk *AND THEN* updates the in memory cache. */
export async function globalCachePut<T extends GlobalCacheItem>(item: T): Promise<boolean> {
	// ensure we have a valid type and cache map
	const key = item.objectType.toLowerCase() + "s";
	const cache = cacheMap.get(key);
	if (!cache) {
		error({ objectType:item.objectType, key });
		return false;
	}

	// ensure this item has an id
	let itemId = item.id ?? item.did ?? item.uuid;
	if (!itemId) {
		/** @todo when can i ensure this will never be called !? */
		error(`globalCachePut(${toLiteral(key)}, ${toLiteral(toGlobalCacheItem(item))})`);
		item.id = randomSnowflake();
		itemId = item.id;
	}

	// write to file using the first id found (should be .id)
	const path = getJsonPath(key, itemId);
	const saved = await writeFile(path, item, true, getCodeName() === "dev").catch(errorReturnFalse);
	if (!saved) {
		return false;
	}

	// rereads and caches the newly written file to ensure our in memory object is clean, fresh, and unspoiled
	return readAndCache(cache, path);
}