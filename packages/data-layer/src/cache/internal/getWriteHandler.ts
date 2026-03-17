import { errorReturnFalse } from "@rsc-utils/core-utils";
import { writeFile } from "@rsc-utils/io-utils";
import type { DataTable } from "../DataTable.js";
import type { CacheItemObjectType, DataMode, GlobalCacheItem } from "../types.js";
import { getJsonPath } from "./getJsonPath.js";

export type WriteHandler = (
	dataTable: DataTable<CacheItemObjectType>,
	item: GlobalCacheItem,
) => Promise<boolean>;

async function writeToBoth(
	dataTable: DataTable<CacheItemObjectType>,
	item: GlobalCacheItem
): Promise<boolean> {

	const toDdb = await writeToDdb(dataTable, item);
	const toFile = await writeToFile(dataTable, item);
	return toDdb === true && toFile === true;

}

async function writeToDdb(
	dataTable: DataTable<CacheItemObjectType>,
	item: GlobalCacheItem,
): Promise<boolean> {

	dataTable;
	item;
	return false;

}

async function writeToDdbFirst(
	dataTable: DataTable<CacheItemObjectType>,
	item: GlobalCacheItem
): Promise<boolean> {

	const toDdb = await writeToDdb(dataTable, item);
	if (toDdb) return toDdb;

	return writeToFile(dataTable, item);
}

async function writeToFile(
	dataTable: DataTable<CacheItemObjectType>,
	item: GlobalCacheItem
): Promise<boolean> {

	const path = getJsonPath(dataTable.tableName, item.id);
	const options = { makeDir:true, formatted:dataTable.formatFiles };
	return writeFile(path, item, options).catch(errorReturnFalse);

}

async function writeToFileFirst(
	dataTable: DataTable<CacheItemObjectType>,
	item: GlobalCacheItem
): Promise<boolean> {

	const toFile = await writeToFile(dataTable, item);
	if (toFile) return toFile;

	return writeToDdb(dataTable, item);
}

/** @internal */
export function getWriteHandler(
	dataMode: DataMode
): WriteHandler {

	switch(dataMode) {
		case "both": return writeToBoth;
		case "ddb": return writeToDdb;
		case "ddb-first": return writeToDdbFirst;
		case "file": return writeToFile;
		case "file-first": return writeToFileFirst;
	}

}