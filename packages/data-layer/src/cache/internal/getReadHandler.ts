import { areEqual, debug, error, noop, warn, type OrUndefined } from "@rsc-utils/core-utils";
import { DdbRepo, readJsonFile } from "@rsc-utils/io-utils";
import type { CacheItemTableName, DataMode, GlobalCacheItem } from "../types.js";
import { getJsonPath } from "./getJsonPath.js";

export type ReadHandler<
	T extends GlobalCacheItem
> = (
	tableName: CacheItemTableName,
	item: GlobalCacheItem
) => Promise<T | undefined>;

async function readFromBoth<
	T extends GlobalCacheItem
>(
	tableName: CacheItemTableName,
	item: GlobalCacheItem
): Promise<OrUndefined<T>> {

	const ddbStart = Date.now();
	const fromDdb = await readFromDdb(tableName, item);
	const ddbDone = Date.now();
	const fileStart = Date.now();
	const fromFile = await readFromFile(tableName, item);
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

	return fromDdb as T ?? fromFile;

}

async function readFromDdb<
	T extends GlobalCacheItem
>(
	tableName: CacheItemTableName,
	item: GlobalCacheItem
): Promise<OrUndefined<T>> {

	const ddbRepo = new DdbRepo(DdbRepo.DdbClientConfig);
	const ddbTable = ddbRepo.for(tableName);
	const ready = await ddbTable.ensure();
	if (!ready) return undefined;

	tableName;
	item;
	return undefined;

}

async function readFromDdbFirst<
	T extends GlobalCacheItem
>(
	tableName: CacheItemTableName,
	item: GlobalCacheItem
): Promise<OrUndefined<T>> {

	const fromDdb = await readFromDdb<T>(tableName, item);
	if (fromDdb) return fromDdb;

	return readFromFile(tableName, item);

}

async function readFromFile<
	T extends GlobalCacheItem
>(
	tableName: CacheItemTableName,
	item: GlobalCacheItem
): Promise<OrUndefined<T>> {

	// read by id first
	const idPath = getJsonPath(tableName, item.id);
	let json = await readJsonFile<T>(idPath).catch(noop);

	// read by did if id missed
	if (!json && item.did) {
		const didPath = getJsonPath(tableName, item.did);
		json = await readJsonFile<T>(didPath).catch(noop);
	}

	// read by uuid id id and did missed
	if (!json && item.uuid) {
		const uuidPath = getJsonPath(tableName, item.uuid);
		json = await readJsonFile<T>(uuidPath).catch(noop);
	}

	return json ?? undefined;

}

async function readFromFileFirst<
	T extends GlobalCacheItem
>(
	tableName: CacheItemTableName,
	item: GlobalCacheItem
): Promise<OrUndefined<T>> {

	const fromFile = await readFromFile<T>(tableName, item);
	if (fromFile) return fromFile;

	return readFromDdb(tableName, item);

}

/** @internal */
export function getReadHandler<
	CacheItem extends GlobalCacheItem
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