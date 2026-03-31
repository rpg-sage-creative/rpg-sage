import { forEachAsync, getDataRoot, noop, tagLiterals, verbose } from "@rsc-utils/core-utils";
import { filterFiles, readJsonFile } from "@rsc-utils/io-utils";
import type { DataTable } from "../DataTable.js";
import { objectTypeToDirName, type BaseCacheItem, type CacheItemObjectType, type DataMode } from "../types.js";
import { getDdbTable } from "./DdbRepo.js";

export type PopulateHandler<
	ObjectType extends CacheItemObjectType,
	CacheItem extends BaseCacheItem<ObjectType> = BaseCacheItem<ObjectType>,
> = (
	dataTable: DataTable<ObjectType, CacheItem>,
) => Promise<boolean>;

async function populateFromBoth<
	ObjectType extends CacheItemObjectType,
	CacheItem extends BaseCacheItem<ObjectType> = BaseCacheItem<ObjectType>,
> (
	dataTable: DataTable<ObjectType, CacheItem>,
): Promise<boolean> {

	// load all the items from the files
	const fromFile = await populateFromFile(dataTable);

	// load all the items from ddb
	const fromDdb = await populateFromDdb(dataTable);

	return fromFile && fromDdb;
}

async function populateFromDdb<
	ObjectType extends CacheItemObjectType,
	CacheItem extends BaseCacheItem<ObjectType> = BaseCacheItem<ObjectType>,
> (
	dataTable: DataTable<ObjectType, CacheItem>,
): Promise<boolean> {

	const { objectType, tableName } = dataTable;

	verbose(tagLiterals`Populating ${objectType} ...`);

	const ddbTable = getDdbTable(objectType);

	verbose(tagLiterals`  Reading from ${tableName} ...`);

	let files = 0;
	let errors = 0;

	await ddbTable.forEachAsync(item => {

		files++;

		const cached = dataTable.put(item as CacheItem);
		if (!cached) {
			errors++;
		}

	});

	// send to the logs so we can see if something is amiss
	verbose({ objectType, tableName, files, errors });

	/** @todo decide what makes a failed populate. errors.length > 0 ??? */

	return true;
}

async function populateFromFile<
	ObjectType extends CacheItemObjectType,
	CacheItem extends BaseCacheItem<ObjectType> = BaseCacheItem<ObjectType>,
> (
	dataTable: DataTable<ObjectType, CacheItem>,
): Promise<boolean> {

	const { objectType } = dataTable;

	verbose(tagLiterals`Populating ${objectType} ...`);

	// iterate the json files and load cache data into memory
	const dirName = objectTypeToDirName(objectType);
	const dirPath = getDataRoot(["sage", dirName]);

	verbose(tagLiterals`  Reading from ${dirPath} ...`);

	const files = await filterFiles(dirPath, { fileExt:"json" });

	verbose(tagLiterals`  Found ${files.length} files ...`);

	const errors: string[] = [];

	await forEachAsync(`  Reading files`, files, async file => {

		const json = await readJsonFile<CacheItem>(file).catch(noop);
		const cached = json ? dataTable.put(json) : false;
		if (!cached) {
			errors.push(file);
		}

	});

	// send to the logs so we can see if something is amiss
	verbose({ objectType, dirName, dirPath, files:files.length, errors:errors.length });

	/** @todo decide what makes a failed populate. errors.length > 0 ??? */

	return true;
}

/** @internal */
export function getPopulateHandler<
	ObjectType extends CacheItemObjectType,
>(
	dataMode: DataMode,
): PopulateHandler<ObjectType> {

	switch(dataMode) {
		case "both": return populateFromBoth;
		case "ddb": return populateFromDdb;
		case "file": return populateFromFile;
	}

}