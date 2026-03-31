import { errorReturnFalse } from "@rsc-utils/core-utils";
import { writeFile, type RepoItem } from "@rsc-utils/io-utils";
import type { DataTable } from "../DataTable.js";
import { objectTypeToDirName, type BaseCacheItem, type CacheItemObjectType, type DataMode } from "../types.js";
import { getDdbTable } from "./DdbRepo.js";
import { getJsonPath } from "./getJsonPath.js";

export type WriteHandler<
	ObjectType extends CacheItemObjectType,
	CacheItem extends BaseCacheItem<ObjectType> = BaseCacheItem<ObjectType>,
	Core extends CacheItem = CacheItem,
> = (
	dataTable: DataTable<ObjectType, CacheItem>,
	core: Core,
) => Promise<boolean>;

async function writeToBoth<
	ObjectType extends CacheItemObjectType,
	CacheItem extends BaseCacheItem<ObjectType> = BaseCacheItem<ObjectType>,
	Core extends CacheItem = CacheItem,
> (
	dataTable: DataTable<ObjectType, CacheItem>,
	core: Core,
): Promise<boolean> {

	const toDdb = await writeToDdb(dataTable, core);
	const toFile = await writeToFile(dataTable, core);
	return toDdb === true && toFile === true;

}

async function writeToDdb<
	ObjectType extends CacheItemObjectType,
	CacheItem extends BaseCacheItem<ObjectType> = BaseCacheItem<ObjectType>,
	Core extends CacheItem = CacheItem,
> (
	dataTable: DataTable<ObjectType, CacheItem>,
	core: Core,
): Promise<boolean> {

	const ddbTable = getDdbTable(dataTable.objectType);
	return ddbTable.save(core as RepoItem).catch(errorReturnFalse);

}

async function writeToFile<
	ObjectType extends CacheItemObjectType,
	CacheItem extends BaseCacheItem<ObjectType> = BaseCacheItem<ObjectType>,
	Core extends CacheItem = CacheItem,
> (
	dataTable: DataTable<ObjectType, CacheItem>,
	core: Core,
): Promise<boolean> {

	const dirName = objectTypeToDirName(dataTable.objectType);
	const filePath = getJsonPath(dirName, core.id);
	const options = { makeDir:true, formatted:dataTable.formatFiles };
	return writeFile(filePath, core, options).catch(errorReturnFalse);

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
		case "file": return writeToFile;
	}

}