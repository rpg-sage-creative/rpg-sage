import type { RepoItem } from "@rsc-utils/aws-utils";
import { forBatchAsync, getDataRoot, initializeConsoleUtilsByEnvironment, trace } from "@rsc-utils/core-utils";
import { filterFiles, readJsonFile } from "@rsc-utils/io-utils";
import { getDdbTable } from "./cache/internal/DdbRepo.js";
import { type BaseCacheItem, type CacheItemObjectType, dirNameToObjectType, isCacheItemDirName, isCacheItemObjectType, objectTypeToDirName } from "./cache/types.js";

initializeConsoleUtilsByEnvironment();

async function main() {
	// const globalCache = GlobalCache.initialize();

	const objectTypes = new Set<CacheItemObjectType>();

	process.argv.forEach(arg => {
		if (isCacheItemObjectType(arg)) objectTypes.add(arg);
		if (isCacheItemDirName(arg)) objectTypes.add(dirNameToObjectType(arg));
	});

	const years = ["2021", "2022", "2023", "2024", "2025", "2026"];
	const yearArgs = process.argv.filter(arg => years.includes(arg));
	if (!yearArgs.length) yearArgs.push(...years);

	for (const objectType of objectTypes) {
		const ddbTable = getDdbTable(objectType);
		const { tableName } = ddbTable;

		trace(`Uploading to DDB: %s ...`, objectType);

		trace(`  Ensuring table exists and is empty ...`);
		// await ddbTable.drop(true).catch(() => {});
		await ddbTable.ensure(true);

		// iterate the json files and load cache data into memory
		const dirPaths: string[] = [];
		if (objectType === "Message") {
			yearArgs.forEach(year => dirPaths.push(getDataRoot(["sage", objectTypeToDirName(objectType), year])));
		}else {
			dirPaths.push(getDataRoot(["sage", objectTypeToDirName(objectType)]));
		}
		for (const dirPath of dirPaths) {
			trace(`  Reading from %s ...`, dirPath);

			const files = await filterFiles(dirPath, { fileExt:"json" });

			trace(`  Found %d files ...`, files.length);

			// const cores: BaseCacheItem[] = [];
			const errors: string[] = [];

			await forBatchAsync(`  Uploading files`, files, ddbTable.repo.batchPutMaxItemCount, async batchFiles => {

				const cores: RepoItem[] = [];
				const coreFiles: string[] = [];
				await Promise.all(batchFiles.map(file =>
					// grab em in bulk
					readJsonFile<BaseCacheItem>(file)
						// store core to save, store coreFiles in case the save fails
						.then(core => { cores.push(core as RepoItem); coreFiles.push(file); })
						// send the file directly to errors
						.catch(() => errors.push(file))
				));

				// try uploading the files in bulk
				const saved = await ddbTable.save(cores as RepoItem[]);
				if (!saved) {
					coreFiles.forEach(file => errors.push(file));
				}

			});

			// send to the logs so we can see if something is amiss
			trace({ tableName, dirPath, files:files.length, errors:errors.length });
		}
	}
}

// make sure we don't trigger this with an index.ts include
if (process.argv[1].endsWith("upload.mjs")) {
	main();
}