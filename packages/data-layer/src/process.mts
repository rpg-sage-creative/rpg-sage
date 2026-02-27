import { errorReturnFalse, errorReturnUndefined, forEachAsync, getDataRoot, initializeConsoleUtilsByEnvironment, stringifyJson, verbose, type Snowflake } from "@rsc-utils/core-utils";
import { deleteFile, filterFiles, readJsonFile, writeFile } from "@rsc-utils/io-utils";
import { ensureSageGameCore, ensureSageMessageReferenceCore, ensureSageServerCore, ensureSageUserCore, type EnsureContext, type SageCore, type SageMessageReferenceCore } from "./index.js";

initializeConsoleUtilsByEnvironment();

type ObjectType = "Game" | "Message" | "Server" | "User";

function isMessage(_core: unknown, objectType: ObjectType): _core is SageMessageReferenceCore {
	return objectType === "Message";
}

type Processor<
	Type extends ObjectType,
	Core extends SageCore<Type, Snowflake> = any
	> = (object: any, context?: EnsureContext) => Core;

async function processObjects<Type extends ObjectType>(objectType: Type, processor: Processor<Type>, yearArgs: string[]): Promise<void> {
	const what = objectType + "s";

	const objectRoot = getDataRoot(`sage/${what.toLowerCase()}`);

	let unableToRead = 0;
	let missingCharacterId = 0;
	let missingUserId = 0;
	let moved = 0;
	let updated = 0;
	let tooMuch = 0;

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

		await forEachAsync(`    Updating ${child ? what + " " + child : what}`, files, async filePath => {
			const oldCore = await readJsonFile<SageCore<Type, Snowflake>>(filePath).catch(errorReturnUndefined) ?? undefined;

			// delete incomplete
			if (!oldCore) {
				await deleteFile(filePath).catch(errorReturnFalse);
				unableToRead++;
				return;
			}

			// delete incomplete
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
				tooMuch++;
			}
		});
	}

	verbose({ unableToRead, missingCharacterId, missingUserId, moved, updated, tooMuch });
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