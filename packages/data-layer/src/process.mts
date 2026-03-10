import { errorReturnFalse, errorReturnUndefined, forEachAsync, getDataRoot, initializeConsoleUtilsByEnvironment, stringifyJson, verbose, type Snowflake } from "@rsc-utils/core-utils";
import { deleteFile, fileExists, filterFiles, readJsonFile, writeFile } from "@rsc-utils/io-utils";
import { stat, Stats } from "node:fs";
import { ensureSageGameCore, ensureSageMessageReferenceCore, ensureSageServerCore, ensureSageUserCore, type EnsureContext, type SageCore, type SageMessageReferenceCore } from "./index.js";

initializeConsoleUtilsByEnvironment();

type ObjectType = "Game" | "Message" | "Server" | "User";

/** false typeguard */
function isMessage(_core: unknown, objectType: ObjectType): _core is SageMessageReferenceCore {
	return objectType === "Message";
}

type Processor<
	Type extends ObjectType,
	Core extends SageCore<Type, Snowflake> = any
	> = (object: any, context?: EnsureContext) => Core;

async function getUpdateTs(filePath: string): Promise<number | undefined> {
	const stats = await new Promise<Stats>((resolve, reject) =>
		stat(filePath, (err, stats: Stats) => err ? reject(err) : resolve(stats))
	).catch(() => undefined);
	return stats?.mtimeMs;
}
async function getNewestCore<Type extends ObjectType>({ dataPath, filePath }: { dataPath:string; filePath:string; }) {
	let core = await readJsonFile<SageCore<Type, Snowflake>>(filePath).catch(errorReturnUndefined) ?? undefined;
	let updatedTs = core ? await getUpdateTs(filePath) : undefined;
	let fileCount = 0;
	const toDelete: { deletePath:string; reason:string; }[] = [];

	if (core) {
		const filePathSet = new Set<string>();
		const filePathMeta: { filePath:string; core:SageCore<Type, Snowflake>; updatedTs:number; }[] = [];

		const getOtherCore = async (id?: string) => {
			if (!id) return;
			const otherFilePath = `${dataPath}/${id}.json`;
			if (!filePathSet.has(otherFilePath)) {
				let otherCore: SageCore<Type, Snowflake> | undefined;
				if (otherFilePath === filePath) {
					// use initially loaded core
					otherCore = core;
				}else if (await fileExists(otherFilePath)) {
					// go fetch duplicate
					otherCore = await readJsonFile<SageCore<Type, Snowflake>>(otherFilePath).catch(errorReturnUndefined) ?? undefined;
					if (!otherCore) {
						toDelete.push({ deletePath:otherFilePath, reason:"invalid" });
					}
				}
				if (otherCore) {
					const otherUpdatedTs = otherCore.updatedTs ?? await getUpdateTs(otherFilePath);
					if (otherUpdatedTs) {
						filePathSet.add(otherFilePath);
						filePathMeta.push({ filePath:otherFilePath, core:otherCore, updatedTs:otherUpdatedTs });
					}
				}
			}
		};

		await getOtherCore(core.id);
		await getOtherCore(core.did);
		await getOtherCore(core.uuid);

		fileCount = filePathSet.size;

		// find index of newest core
		let metaIndex = -1;
		filePathMeta.forEach((meta, index) => {
			if (metaIndex < 0 || (updatedTs && meta.updatedTs > updatedTs)) {
				metaIndex = index;
			}
		});
		// mark other cores for deletion and store newest core
		filePathMeta.forEach((meta, index) => {
			if (index === metaIndex) {
				filePath = meta.filePath;
				core = meta.core;
			}else {
				toDelete.push({ deletePath:meta.filePath, reason:"duplicate" });
			}
		});

	}else {

		// let's fail out
		fileCount = 1;
		toDelete.push({ deletePath:filePath, reason:"invalid" });

	}

	return { fileCount, toDelete, filePath, core };

}

async function processObjects<Type extends ObjectType>(objectType: Type, processor: Processor<Type>, yearArgs: string[]): Promise<void> {
	const what = objectType + "s";

	const objectRoot = getDataRoot(`sage/${what.toLowerCase()}`);

	/** cannot read the file */
	let unableToRead = 0;
	/** should have had a character id and didn't */
	let missingCharacterId = 0;
	/** should have had a user id and didn't */
	let missingUserId = 0;
	/** file path/name was wrong and moved (may have had changes) */
	let moved = 0;
	/** the target file already exists */
	let targetExists = 0;
	/** contents changed (but file wasn't moved) */
	let updated = 0;
	/** a second update pass changed the contents (this shouldn't happen) */
	let updatedTwice = 0;
	/** this object had more than 1 file */
	let duplicatesDeleted = 0;

	verbose(`ObjectType: ${what}`);
	verbose(`  ${what} Path: ${objectRoot}`);

	const children = objectType === "Message" ? yearArgs : [""];
	if (children[0]) {
		verbose(`  ${what} Children: ${children}`);
	}
	for (const child of children) {
		const dataPath = child ? `${objectRoot}/${child}` : objectRoot;
		if (child) {
			verbose(`  ${what} ${child} Path: ${dataPath}`);
		}

		verbose(`  Counting ${what} ...`);
		const files = await filterFiles(dataPath, { fileExt:"json", recursive:true });
		verbose(`                 ... ${files.length} found.`)

		const deletedSet = new Set<string>();
		await forEachAsync(`    Updating ${child ? what + " " + child : what}`, files, async filePath => {
			// due to getNewestCore, we might delete a later item
			if (deletedSet.has(filePath)) return;

			// get newest core for the filePath
			const meta = await getNewestCore({ dataPath, filePath });

			// get the returned core
			const oldCore = meta.core;

			// update the filePath to match the returned core
			filePath = meta.filePath;

			// delete invalid/duplicate files
			for (const { deletePath, reason } of meta.toDelete) {
				if (reason === "invalid") {
					unableToRead++;
					await deleteFile(deletePath).catch(() => false);
					deletedSet.add(deletePath);
				}
				if (reason === "duplicate") {
					duplicatesDeleted++;
					verbose(`        Deleting "${reason}" of ${filePath.split("/").pop()}: ${deletePath.split("/").pop()}; `);
					await deleteFile(deletePath).catch(errorReturnFalse);
					deletedSet.add(deletePath);
				}
			}

			if (!oldCore) {
				return;
			}

			// delete incomplete message
			if (isMessage(oldCore, objectType) && !oldCore.characterId) {
				await deleteFile(filePath).catch(errorReturnFalse);
				missingCharacterId++;
				return;
			}

			// save for comparison later
			const before = stringifyJson(oldCore);

			const updatedCore = processor(oldCore) as SageCore<Type, Snowflake>;

			// delete incomplete
			if (isMessage(updatedCore, objectType) && !updatedCore.userId) {
				await deleteFile(filePath).catch(errorReturnFalse);
				missingUserId++;
				return;
			}

			let writeFilePath = `${dataPath}/${updatedCore.id}.json`;

			// messages are stored by year
			if (isMessage(updatedCore, objectType)) {
				const idYear = new Date(updatedCore.ts).getFullYear();
				writeFilePath = `${objectRoot}/${idYear}/${updatedCore.id}.json`;
			}

			const wrongPath = filePath !== writeFilePath;
			if (wrongPath) {
				const exists = await fileExists(writeFilePath);
				if (exists) {
					targetExists++;
				}
			}

			const after = stringifyJson(updatedCore);
			const hasChanges = before !== after;

			if (wrongPath || hasChanges) {
				await writeFile(writeFilePath, updatedCore, { makeDir:true }).catch(errorReturnFalse);

				if (wrongPath) {
					await deleteFile(filePath).catch(errorReturnFalse);
					moved++;

				}else {
					updated++;
				}
			}

			const hasMoreChanges = after !== stringifyJson(processor(updatedCore));
			if (hasMoreChanges) {
				updatedTwice++;
			}
		});
	}

	verbose({ unableToRead, missingCharacterId, missingUserId, moved, targetExists, updated, updatedTwice, duplicatesDeleted });
}

async function main() {
	const processors: Record<ObjectType, Processor<ObjectType>> = {
		"Game": ensureSageGameCore,
		"Message": ensureSageMessageReferenceCore,
		"Server": ensureSageServerCore,
		"User": ensureSageUserCore,
	};

	const objectTypeArgs = (Object.keys(processors) as (keyof typeof processors)[])
		.filter(key => process.argv.includes(key) || process.argv.includes(key.toLowerCase() + "s"));

	const years = ["2021", "2022", "2023", "2024", "2025", "2026"];
	const yearArgs = process.argv.filter(arg => years.includes(arg));
	if (!yearArgs.length) yearArgs.push(...years);

	for (const objectType of objectTypeArgs) {
		await processObjects(objectType, processors[objectType], yearArgs);
	}
}

// make sure we don't trigger this with an index.ts include
if (process.argv[1].endsWith("process.mjs")) {
	main();
}