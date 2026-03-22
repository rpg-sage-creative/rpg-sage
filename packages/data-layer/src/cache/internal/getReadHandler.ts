import { areEqual, debug, error, noop, warn } from "@rsc-utils/core-utils";
import { readJsonFile, type RepoId } from "@rsc-utils/io-utils";
import type { BaseCacheItem, CacheItemTableName, DataMode } from "../types.js";
import { getDdbTable } from "./DdbRepo.js";
import { getJsonPath } from "./getJsonPath.js";

export type ReadHandler<
	Core extends BaseCacheItem
> = (
	tableName: CacheItemTableName,
	item: BaseCacheItem
) => Promise<Core | undefined>;

async function readFromBoth<
	Core extends BaseCacheItem
>(
	tableName: CacheItemTableName,
	item: BaseCacheItem
): Promise<Core | undefined> {

	const ddbStart = Date.now();
	const fromDdb = await readFromDdb<Core>(tableName, item);
	const ddbDone = Date.now();
	const fileStart = Date.now();
	const fromFile = await readFromFile<Core>(tableName, item);
	const fileDone = Date.now();
	debug({ ddbStart, ddbDone, ddbMs:ddbDone-ddbStart, fileStart, fileDone, fileMs:fileDone-fileStart });

	if (!fromDdb && !fromFile) {
		error(`fetchFromBoth - both missing: ${tableName} -> ${item}`);
		return undefined;
	}

	if (!fromDdb || !fromFile) {
		warn(`fetchFromBoth - ${fromDdb ? "file" : "ddb"} missing: ${tableName} -> ${item}`);

	}else if (!areEqual(fromDdb, fromFile)) {
		warn(`fetchFromBoth - different json: ${tableName} -> ${item}`);
	}

	return fromDdb ?? fromFile;

}

async function readFromDdb<
	Core extends BaseCacheItem
>(
	tableName: CacheItemTableName,
	{ did, id, uuid }: BaseCacheItem
): Promise<Core | undefined> {

	const ddbTable = getDdbTable(tableName);

	const ids = [id, did, uuid].filter(s => s) as RepoId[];
	const cores = await ddbTable.get(ids);
	for (const core of cores) {
		if (core) {
			return core as Core;
		}
	}

	return undefined;

}

async function readFromDdbFirst<
	T extends BaseCacheItem
>(
	tableName: CacheItemTableName,
	cacheItem: BaseCacheItem
): Promise<T | undefined> {

	const fromDdb = await readFromDdb<T>(tableName, cacheItem);
	if (fromDdb) return fromDdb;

	return readFromFile(tableName, cacheItem);

}

async function readFromFile<
	T extends BaseCacheItem
>(
	tableName: CacheItemTableName,
	cacheItem: BaseCacheItem
): Promise<T | undefined> {

	// read by id first
	const idPath = getJsonPath(tableName, cacheItem.id);
	let json = await readJsonFile<T>(idPath).catch(noop);

	// read by did if id missed
	if (!json && cacheItem.did) {
		const didPath = getJsonPath(tableName, cacheItem.did);
		json = await readJsonFile<T>(didPath).catch(noop);
	}

	// read by uuid id id and did missed
	if (!json && cacheItem.uuid) {
		const uuidPath = getJsonPath(tableName, cacheItem.uuid);
		json = await readJsonFile<T>(uuidPath).catch(noop);
	}

	return json ?? undefined;

}

async function readFromFileFirst<
	T extends BaseCacheItem
>(
	tableName: CacheItemTableName,
	cacheItem: BaseCacheItem
): Promise<T | undefined> {

	const fromFile = await readFromFile<T>(tableName, cacheItem);
	if (fromFile) return fromFile;

	return readFromDdb(tableName, cacheItem);

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
		case "ddb-first": return readFromDdbFirst;
		case "file": return readFromFile;
		case "file-first": return readFromFileFirst;
	}

}