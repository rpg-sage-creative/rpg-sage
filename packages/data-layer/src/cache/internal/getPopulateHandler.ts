import { forEachAsync, getDataRoot, tagLiterals, verbose } from "@rsc-utils/core-utils";
import { DdbRepo, filterFiles } from "@rsc-utils/io-utils";
import { basename } from "node:path";
import type { DataTable } from "../DataTable.js";
import type { BaseCacheItem, DataMode } from "../types.js";

export type PopulateHandler = (
	dataTable: DataTable<any>,
) => Promise<boolean>;

export async function populateFromBoth<
	CacheItem extends BaseCacheItem = BaseCacheItem
>(
	dataTable: DataTable<any>,
): Promise<boolean> {

	// load all the items from the files
	const fromFile = await populateFromFile<CacheItem>(dataTable);

	// load all the items from ddb
	const fromDdb = await populateFromDdb<CacheItem>(dataTable);

	return fromFile && fromDdb;
}

export async function populateFromDdb<
	CacheItem extends BaseCacheItem = BaseCacheItem
>(
	dataTable: DataTable<any>,
): Promise<boolean> {

	const { tableName } = dataTable;

	verbose(tagLiterals`Populating ${tableName} ...`);

	const ddbRepo = new DdbRepo(DdbRepo.DdbClientConfig);
	const ddbTable = ddbRepo.for(dataTable.tableName);

	verbose(tagLiterals`  Reading from ${tableName} ...`);

	const ready = await ddbTable.ensure();

	let files = 0;
	let errors = 0;

	if (ready) {

		await ddbTable.forEachAsync<CacheItem>(item => {

			const cached = dataTable.put(item);
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
	CacheItem extends BaseCacheItem = BaseCacheItem
>(
	dataTable: DataTable<any>,
): Promise<boolean> {

	// load all the items from ddb
	const fromDdb = await populateFromDdb<CacheItem>(dataTable);
	if (fromDdb) return fromDdb;

	// load all the items from the files
	return populateFromFile<CacheItem>(dataTable);
}

export async function populateFromFile<
	CacheItem extends BaseCacheItem = BaseCacheItem
>(
	dataTable: DataTable<any>,
): Promise<boolean> {

	const { objectType, tableName } = dataTable;

	verbose(tagLiterals`Populating ${tableName} ...`);

	// iterate the json files and load cache data into memory
	const dirPath = getDataRoot(["sage", tableName]);

	verbose(tagLiterals`  Reading from ${tableName} ...`);

	const files = await filterFiles(dirPath, { fileExt:"json" });

	verbose(tagLiterals`  Found ${files.length} files ...`);

	const errors: string[] = [];

	await forEachAsync(`  Reading files`, files, async file => {

		const id = basename(file, ".json");
		const item = { id, objectType } as CacheItem;
		const cached = await dataTable.fetchAndCache(item);
		if (!cached) {
			errors.push(file);
		}

	});

	// send to the logs so we can see if something is amiss
	verbose({ tableName, dirPath, files:files.length, errors:errors.length });

	/** @todo decide what makes a failed populate. errors.length > 0 ??? */

	return true;
}

export async function populateFromFileFirst<
	CacheItem extends BaseCacheItem = BaseCacheItem
>(
	dataTable: DataTable<any>,
): Promise<boolean> {

	// load all the items from the files
	const fromFile = await populateFromDdb<CacheItem>(dataTable);
	if (fromFile) return fromFile;

	// load all the items from ddb
	return populateFromDdb<CacheItem>(dataTable);
}

/** @internal */
export function getPopulateHandler(
	dataMode: DataMode,
): PopulateHandler {

	switch(dataMode) {
		case "both": return populateFromBoth;
		case "ddb": return populateFromDdb;
		case "ddb-first": return populateFromDdbFirst;
		case "file": return populateFromFile;
		case "file-first": return populateFromFileFirst;
	}

}