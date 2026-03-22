import { errorReturnFalse } from "@rsc-utils/core-utils";
import { writeFile, type RepoItem } from "@rsc-utils/io-utils";
import type { DataTable } from "../DataTable.js";
import type { BaseCacheItem, CacheItemObjectType, CacheItemTableName, DataMode } from "../types.js";
import { getDdbTable } from "./DdbRepo.js";
import { getJsonPath } from "./getJsonPath.js";

export type WriteHandler<
	ObjectType extends CacheItemObjectType,
	TableName extends CacheItemTableName = Lowercase<`${ObjectType}s`>,
	CacheItem extends BaseCacheItem<ObjectType> = BaseCacheItem<ObjectType>,
	Core extends CacheItem = CacheItem,
> = (
	dataTable: DataTable<ObjectType, TableName, CacheItem>,
	core: Core,
) => Promise<boolean>;

async function writeToBoth<
	ObjectType extends CacheItemObjectType,
	TableName extends CacheItemTableName = Lowercase<`${ObjectType}s`>,
	CacheItem extends BaseCacheItem<ObjectType> = BaseCacheItem<ObjectType>,
	Core extends CacheItem = CacheItem,
> (
	dataTable: DataTable<ObjectType, TableName, CacheItem>,
	core: Core,
): Promise<boolean> {

	const toDdb = await writeToDdb(dataTable, core);
	const toFile = await writeToFile(dataTable, core);
	return toDdb === true && toFile === true;

}

async function writeToDdb<
	ObjectType extends CacheItemObjectType,
	TableName extends CacheItemTableName = Lowercase<`${ObjectType}s`>,
	CacheItem extends BaseCacheItem<ObjectType> = BaseCacheItem<ObjectType>,
	Core extends CacheItem = CacheItem,
> (
	dataTable: DataTable<ObjectType, TableName, CacheItem>,
	core: Core,
): Promise<boolean> {

	const ddbTable = getDdbTable(dataTable.tableName);
	return ddbTable.save(core as RepoItem).catch(errorReturnFalse);

}

async function writeToDdbFirst<
	ObjectType extends CacheItemObjectType,
	TableName extends CacheItemTableName = Lowercase<`${ObjectType}s`>,
	CacheItem extends BaseCacheItem<ObjectType> = BaseCacheItem<ObjectType>,
	Core extends CacheItem = CacheItem,
> (
	dataTable: DataTable<ObjectType, TableName, CacheItem>,
	core: Core,
): Promise<boolean> {

	const toDdb = await writeToDdb(dataTable, core);
	if (toDdb) return toDdb;

	return writeToFile(dataTable, core);
}

async function writeToFile<
	ObjectType extends CacheItemObjectType,
	TableName extends CacheItemTableName = Lowercase<`${ObjectType}s`>,
	CacheItem extends BaseCacheItem<ObjectType> = BaseCacheItem<ObjectType>,
	Core extends CacheItem = CacheItem,
> (
	dataTable: DataTable<ObjectType, TableName, CacheItem>,
	core: Core,
): Promise<boolean> {

	const path = getJsonPath(dataTable.tableName, core.id);
	const options = { makeDir:true, formatted:dataTable.formatFiles };
	return writeFile(path, core, options).catch(errorReturnFalse);

}

async function writeToFileFirst<
	ObjectType extends CacheItemObjectType,
	TableName extends CacheItemTableName = Lowercase<`${ObjectType}s`>,
	CacheItem extends BaseCacheItem<ObjectType> = BaseCacheItem<ObjectType>,
	Core extends CacheItem = CacheItem,
> (
	dataTable: DataTable<ObjectType, TableName, CacheItem>,
	core: Core,
): Promise<boolean> {

	const toFile = await writeToFile(dataTable, core);
	if (toFile) return toFile;

	return writeToDdb(dataTable, core);
}

/** @internal */
export function getWriteHandler<
	ObjectType extends CacheItemObjectType,
> (
	dataMode: DataMode
): WriteHandler<ObjectType> {

	switch(dataMode) {
		case "both": return writeToBoth;
		case "ddb": return writeToDdb;
		case "ddb-first": return writeToDdbFirst;
		case "file": return writeToFile;
		case "file-first": return writeToFileFirst;
	}

}