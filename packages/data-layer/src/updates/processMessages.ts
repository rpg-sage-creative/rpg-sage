import { errorReturnFalse, errorReturnUndefined, forEachAsync, stringifyJson, verbose } from "@rsc-utils/core-utils";
import { deleteFile, readJsonFile, writeFile } from "@rsc-utils/io-utils";
import type { SageMessageReferenceCore } from "../types/index.js";
import { initProcessor } from "./common.js";
import { updateSageMessageReference } from "./updateSageMessageReference.js";

/**
 * Processes every dialog message file to update its content and filename to match the latest schema
 */
export async function processMessages() {
	const { dataRoot, files } = await initProcessor("Messages");

	let unableToRead = 0;
	let missingCharacterId = 0;
	let missingUserId = 0;
	let moved = 0;
	let updated = 0;

	await forEachAsync("Messages", files, async filePath => {
		const oldCore = await readJsonFile<SageMessageReferenceCore>(filePath).catch(errorReturnUndefined) ?? undefined;

		// delete incomplete
		if (!oldCore) {
			await deleteFile(filePath).catch(errorReturnFalse);
			unableToRead++;
			return;
		}

		// delete incomplete
		if (!oldCore.characterId) {
			await deleteFile(filePath).catch(errorReturnFalse);
			missingCharacterId++;
			return;
		}

		// save for comparison later
		const before = stringifyJson(oldCore);

		const updatedCore = updateSageMessageReference(oldCore);

		// delete incomplete
		if (!updatedCore.userId) {
			await deleteFile(filePath).catch(errorReturnFalse);
			missingUserId++;
			return;
		}

		// messages are stored by year
		const idYear = new Date(updatedCore.ts).getFullYear();

		const writeFilePath = `${dataRoot}/${idYear}/${updatedCore.id}.json`;
		const wrongPath = filePath !== writeFilePath;

		const hasChanges = before !== stringifyJson(updatedCore);

		if (wrongPath || hasChanges) {
			await writeFile(writeFilePath, updatedCore, { makeDir:true }).catch(errorReturnFalse);

			if (wrongPath) {
				await deleteFile(filePath).catch(errorReturnFalse);
				moved++;

			}else {
				updated++;
			}
		}
	});

	verbose({ unableToRead, missingCharacterId, missingUserId, moved, updated });
}
