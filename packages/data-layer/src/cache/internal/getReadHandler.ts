import { areEqual, debug, error, isDefined, noop, warn } from "@rsc-utils/core-utils";
import { readJsonFile, type RepoId } from "@rsc-utils/io-utils";
import { objectTypeToDirName, type BaseCacheItem, type CacheItemObjectType, type DataMode } from "../types.js";
import { getDdbTable } from "./DdbRepo.js";
import { getJsonPath } from "./getJsonPath.js";

export type ReadHandler<
	Core extends BaseCacheItem
> = (
	objectType: CacheItemObjectType,
	item: BaseCacheItem
) => Promise<Core | undefined>;

async function readFromBoth<
	Core extends BaseCacheItem
>(
	objectType: CacheItemObjectType,
	item: BaseCacheItem
): Promise<Core | undefined> {

	const ddbStart = Date.now();
	const fromDdb = await readFromDdb<Core>(objectType, item);
	const ddbDone = Date.now();
	const fileStart = Date.now();
	const fromFile = await readFromFile<Core>(objectType, item);
	const fileDone = Date.now();
	debug({ ddbStart, ddbDone, ddbMs:ddbDone-ddbStart, fileStart, fileDone, fileMs:fileDone-fileStart });

	if (!fromDdb && !fromFile) {
		error(`fetchFromBoth - both missing: ${objectType} -> ${item}`);
		return undefined;
	}

	if (!fromDdb || !fromFile) {
		warn(`fetchFromBoth - ${fromDdb ? "file" : "ddb"} missing: ${objectType} -> ${item}`);

	}else if (!areEqual(fromDdb, fromFile)) {
		warn(`fetchFromBoth - different json: ${objectType} -> ${item}`);
	}

	return fromDdb ?? fromFile;

}

async function readFromDdb<
	Core extends BaseCacheItem
>(
	objectType: CacheItemObjectType,
	{ did, id, uuid }: BaseCacheItem
): Promise<Core | undefined> {

	const ddbTable = getDdbTable(objectType);

	const ids = [id, did, uuid].filter(isDefined) as RepoId[];
	const cores = await ddbTable.get(ids);
	for (const core of cores) {
		if (core) {
			return core as Core;
		}
	}

	return undefined;

}

async function readFromFile<
	T extends BaseCacheItem
>(
	objectType: CacheItemObjectType,
	cacheItem: BaseCacheItem
): Promise<T | undefined> {

	const dirName = objectTypeToDirName(objectType);

	// read by id first
	const idPath = getJsonPath(dirName, cacheItem.id);
	let json = await readJsonFile<T>(idPath).catch(noop);

	// read by did if id missed
	if (!json && cacheItem.did && cacheItem.id !== cacheItem.did) {
		const didPath = getJsonPath(dirName, cacheItem.did);
		json = await readJsonFile<T>(didPath).catch(noop);
	}

	// read by uuid id id and did missed
	if (!json && cacheItem.uuid && cacheItem.id !== cacheItem.uuid) {
		const uuidPath = getJsonPath(dirName, cacheItem.uuid);
		json = await readJsonFile<T>(uuidPath).catch(noop);
	}

	return json ?? undefined;

}

/** @internal */
export function getReadHandler<
	CacheItem extends BaseCacheItem
>(
	dataMode: DataMode
): ReadHandler<CacheItem> {

	switch(dataMode) {
		case "both": return readFromBoth;
		case "ddb": return readFromDdb;
		case "file": return readFromFile;
	}

}