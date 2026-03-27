import { forEachAsync, getDataRoot, noop, tagLiterals, verbose } from "@rsc-utils/core-utils";
import { DdbRepo, filterFiles, readJsonFile } from "@rsc-utils/io-utils";
import type { DataTable } from "../DataTable.js";
import type { BaseCacheItem, CacheItemObjectType, DataMode } from "../types.js";

export type PopulateHandler<
	ObjectType extends CacheItemObjectType,
	CacheItem extends BaseCacheItem<ObjectType> = BaseCacheItem<ObjectType>,
> = (
	dataTable: DataTable<ObjectType, CacheItem>,
) => Promise<boolean>;

export async function populateFromBoth<
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

export async function populateFromDdb<
	ObjectType extends CacheItemObjectType,
	CacheItem extends BaseCacheItem<ObjectType> = BaseCacheItem<ObjectType>,
> (
	dataTable: DataTable<ObjectType, CacheItem>,
): Promise<boolean> {

	const { tableName } = dataTable;

	verbose(tagLiterals`Populating ${tableName} ...`);

	const ddbRepo = new DdbRepo(
		DdbRepo.DdbClientConfig,
		{ tableNameParser:() => tableName },
	);
	const ddbTable = ddbRepo.for(dataTable.objectType);

	verbose(tagLiterals`  Reading from ${tableName} ...`);

	const response = await ddbTable.ensure(true);
	const ready = response.TableDescription?.TableName === tableName;

	let files = 0;
	let errors = 0;

	if (ready) {

		await ddbTable.forEachAsync(item => {

			const cached = dataTable.put(item as CacheItem);
			if (!cached) {
				errors++;
			}

		});

	}


	// send to the logs so we can see if something is amiss
	verbose({ tableName, files, errors });

	/** @todo decide what makes a failed populate. errors.length > 0 ??? */

	return true;
}

export async function populateFromDdbFirst<
	ObjectType extends CacheItemObjectType,
	CacheItem extends BaseCacheItem<ObjectType> = BaseCacheItem<ObjectType>,
> (
	dataTable: DataTable<ObjectType, CacheItem>,
): Promise<boolean> {

	// load all the items from ddb
	const fromDdb = await populateFromDdb(dataTable);
	if (fromDdb) return fromDdb;

	// load all the items from the files
	return populateFromFile(dataTable);
}

export async function populateFromFile<
	ObjectType extends CacheItemObjectType,
	CacheItem extends BaseCacheItem<ObjectType> = BaseCacheItem<ObjectType>,
> (
	dataTable: DataTable<ObjectType, CacheItem>,
): Promise<boolean> {

	const { objectType, tableName } = dataTable;

	verbose(tagLiterals`Populating ${objectType} ...`);

	// iterate the json files and load cache data into memory
	const dirPath = getDataRoot(["sage", tableName]);

	verbose(tagLiterals`  Reading from ${dirPath} ...`);

	const files = await filterFiles(dirPath, { fileExt:"json" });

	verbose(tagLiterals`  Found ${files.length} files ...`);

	const errors: string[] = [];

	await forEachAsync(`  Reading files`, files, async file => {

		const json = await readJsonFile<CacheItem>(file).catch(noop);
		if (json) {
			dataTable.put(json);
		}else {
			errors.push(file);
		}

	});

	// send to the logs so we can see if something is amiss
	verbose({ tableName, dirPath, files:files.length, errors:errors.length });

	/** @todo decide what makes a failed populate. errors.length > 0 ??? */

	return true;
}

export async function populateFromFileFirst<
	ObjectType extends CacheItemObjectType,
	CacheItem extends BaseCacheItem<ObjectType> = BaseCacheItem<ObjectType>,
>(
	dataTable: DataTable<ObjectType, CacheItem>,
): Promise<boolean> {

	// load all the items from the files
	const fromFile = await populateFromFile(dataTable);
	if (fromFile) return fromFile;

	// load all the items from ddb
	return populateFromDdb(dataTable);
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
		case "ddb-first": return populateFromDdbFirst;
		case "file": return populateFromFile;
		case "file-first": return populateFromFileFirst;
	}

}