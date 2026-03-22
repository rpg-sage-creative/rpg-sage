import { forEachAsync, getDataRoot, initializeConsoleUtilsByEnvironment, noop, tagLiterals, verbose } from "@rsc-utils/core-utils";
import { filterFiles, readJsonFile, type RepoItem } from "@rsc-utils/io-utils";
import { getDdbTable } from "./cache/internal/DdbRepo.js";
import { type BaseCacheItem, type CacheItemObjectType, isCacheItemObjectType, isCacheItemTableName, objectTypeToTableName, tableNameToObjectType } from "./cache/types.js";

initializeConsoleUtilsByEnvironment();

async function main() {
	// const globalCache = GlobalCache.initialize();

	const objectTypes = new Set<CacheItemObjectType>();

	process.argv.forEach(arg => {
		if (isCacheItemObjectType(arg)) objectTypes.add(arg);
		if (isCacheItemTableName(arg)) objectTypes.add(tableNameToObjectType(arg));
	});

	const years = ["2021", "2022", "2023", "2024", "2025", "2026"];
	const yearArgs = process.argv.filter(arg => years.includes(arg));
	if (!yearArgs.length) yearArgs.push(...years);

	for (const objectType of objectTypes) {
		const ddbTable = getDdbTable(objectTypeToTableName(objectType));
		const { tableName } = ddbTable;

		verbose(tagLiterals`Uploading to DDB: ${objectType} ...`);

		verbose(`  Ensuring table exists and is empty ...`);
		await ddbTable.drop(true);
		await ddbTable.ensure(true);

		// iterate the json files and load cache data into memory
		const dirPath = getDataRoot(["sage", tableName]);

		verbose(tagLiterals`  Reading from ${dirPath} ...`);

		const files = await filterFiles(dirPath, { fileExt:"json" });

		verbose(tagLiterals`  Found ${files.length} files ...`);

		// const cores: BaseCacheItem[] = [];
		const errors: string[] = [];

		await forEachAsync(`  Reading files`, files, async file => {

			const core = await readJsonFile<BaseCacheItem>(file).catch(noop);
			if (core) {

				// cores.push(core);
				// if (cores.length === DdbRepo.BatchGetMaxItemCount) {
				// }
				const saved = await ddbTable.save(core as RepoItem);
				if (!saved) {
					errors.push(file);
				}

			}else {
				errors.push(file);
			}

		});

		// send to the logs so we can see if something is amiss
		verbose({ tableName, dirPath, files:files.length, errors:errors.length });
	}
}

// make sure we don't trigger this with an index.ts include
if (process.argv[1].endsWith("upload.mjs")) {
	main();
}