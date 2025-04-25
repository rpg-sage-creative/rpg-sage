import { debug, error, errorReturnFalse, errorReturnUndefined, getCodeName, getDataRoot, randomSnowflake, toLiteral } from "@rsc-utils/core-utils";
import { filterFiles, readJsonFile, writeFile } from "@rsc-utils/io-utils";

export type GlobalCacheItem = { id:string; did?:string; uuid?:string; objectType:string; };
function toGlobalCacheItem(item: GlobalCacheItem): GlobalCacheItem {
	const { id, did, uuid, objectType } = item;
	return { id, did, uuid, objectType };
}

export type GameCacheItem = GlobalCacheItem & { serverDid:string; archivedTs?:number; users?:{did?:string;}[]; channels?:{id:string;did?:string;}[] };
function simplifyCacheItem(core: GlobalCacheItem | GameCacheItem) {
	let { id, did, uuid, objectType, serverDid, archivedTs, users, channels } = core as GameCacheItem;
	users = users?.map(({ did }) => ({ did }));
	channels = channels?.map(({ id, did }) => ({ id, did }));
	return { id, did, uuid, objectType, serverDid, archivedTs, users, channels };
}

const cacheMap = new Map<string, Map<string, GlobalCacheItem>>();

export function globalCacheFilter<T extends GlobalCacheItem>(key: string, filter: (core: T) => unknown): T[] {
	const cache = cacheMap.get(key);
	if (!cache) {
		return [];
	}

	const filtered: T[] = [];

	const cores = cache.values() as MapIterator<T>;
	for (const core of cores) {
		if (filter(core)) {
			filtered.push(globalCacheGet<T>(key, core.id) as T);
		}
	}

	return filtered;
}

export function globalCacheFind<T extends GlobalCacheItem>(key: string, filter: (core: T) => unknown): T | undefined {
	const cache = cacheMap.get(key);
	if (!cache) {
		return undefined;
	}

	const cores = cache.values() as MapIterator<T>;
	for (const core of cores) {
		if (filter(core)) {
			return globalCacheGet(key, core.id);
		}
	}

	return undefined;
}

export function globalCacheGet<T extends GlobalCacheItem>(key: string, id: string): T | undefined {
	return cacheMap.get(key)?.get(id) as T;
}

export async function globalCacheRead<T extends GlobalCacheItem>(item: GlobalCacheItem): Promise<T | undefined> {
	const key = item.objectType.toLowerCase() + "s";
	const itemId = item.id ?? item.did ?? item.uuid;
	if (!itemId) {
		error(`globalCacheRead(${toLiteral(key)}, ...${toLiteral(toGlobalCacheItem(item))})`);
		return undefined;
	}

	const path = `${getDataRoot(`sage/${key}`)}/${itemId}.json`;
	const json = await readJsonFile<T>(path).catch(() => undefined);
	return json ?? undefined;
}

async function readAndCache(cache: Map<string, GlobalCacheItem>, path: string): Promise<boolean> {
	let json = await readJsonFile<GlobalCacheItem>(path).catch(errorReturnUndefined);
	if (!json) {
		return false;
	}
	json = simplifyCacheItem(json);
	if (json?.id) cache.set(json.id, json);
	if (json?.did) cache.set(json.did, json);
	if (json?.uuid) cache.set(json.uuid, json);
	return true;
}

export async function globalCachePopulate(key: string): Promise<boolean> {
	if (!cacheMap.has(key)) {
		cacheMap.set(key, new Map());
	}

	const cache = cacheMap.get(key)!;

	const path = getDataRoot(`sage/${key}`);
	const files = await filterFiles(path, { fileExt:"json" });
	for (const file of files) {
		const bool = await readAndCache(cache, file);
		if (!bool) {
			error({ key, path });
			return false;
		}
	}

	debug({ key, path, files:files.length, keys:cache.size });

	return true;
}

export async function globalCachePut<T extends GlobalCacheItem>(item: T): Promise<boolean> {
	const key = item.objectType.toLowerCase() + "s";
	const cache = cacheMap.get(key);
	if (!cache) {
		error({ objectType:item.objectType, key });
		return false;
	}

	let itemId = item.id ?? item.did ?? item.uuid;
	if (!itemId) {
		error(`globalCachePut(${toLiteral(key)}, ${toLiteral(toGlobalCacheItem(item))})`);
		item.id = randomSnowflake();
		itemId = item.id;
	}

	const path = `${getDataRoot(`sage/${key}`)}/${itemId}.json`;
	const saved = await writeFile(path, item, true, getCodeName() === "dev").catch(errorReturnFalse);
	if (!saved) {
		return false;
	}

	return readAndCache(cache, path);
}