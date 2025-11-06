import { enableLogLevels, errorReturnFalse, errorReturnUndefined, forEachAsync, getDataRoot, snowflakeToDate, verbose, type Snowflake } from "@rsc-utils/core-utils";
import { deleteFile, fileExistsSync, filterFiles, readJsonFile, writeFile } from "@rsc-utils/io-utils";
import { updateSageMessage, type SageMessageResolvable } from "../sage-lib/sage/repo/DialogMessageRepository.js";


/**
 * Processes every dialog message file to update its content and filename to match the latest schema
 */
async function main({ recursive }: { recursive:boolean }) {
	enableLogLevels("development");

	verbose(`Updating Dialog Messages ...`);

	const messagesRoot = fileExistsSync(`/Users/randaltmeyer`)
		? `/Users/randaltmeyer/tmp/data/sage/messages`
		: getDataRoot("sage/messages");
	verbose(`  Messages Root: ${messagesRoot}`);

	const messageFiles = await filterFiles(messagesRoot, { fileExt:"json", recursive });
	verbose(`  Messages (recursive=${recursive}): ${messageFiles.length}`);

	let unableToRead = 0;
	let missingCharacterId = 0;
	let missingUserId = 0;
	let moved = 0;
	let updated = 0;

	await forEachAsync("Messages", messageFiles, async filePath => {
		const fileName = filePath.split("/").pop();
		const ids = fileName?.split(".")[0].split("-");
		const messageId = ids?.pop();
		const oldCore = await readJsonFile<SageMessageResolvable>(filePath).catch(errorReturnUndefined) ?? undefined;
		if (!oldCore) {
			await deleteFile(filePath).catch(errorReturnFalse);
			unableToRead++;
			return;
		}
		if (!oldCore.characterId) {
			await deleteFile(filePath).catch(errorReturnFalse);
			missingCharacterId++;
			return;
		}
		const updatedCore = updateSageMessage(oldCore);
		if (!updatedCore.userId) {
			await deleteFile(filePath).catch(errorReturnFalse);
			missingUserId++;
			return;
		}
		const idYear = snowflakeToDate(messageId as Snowflake).getFullYear();
		if (updatedCore !== oldCore || !filePath.includes(`/${idYear}/`)) {
			const newFilePath = `${messagesRoot}/${idYear}/${messageId}.json`;
			await writeFile(newFilePath, updatedCore, true).catch(errorReturnFalse);
			if (filePath !== newFilePath) {
				await deleteFile(filePath).catch(errorReturnFalse);
				moved++;
			}else {
				updated++;
			}
		}
	});

	verbose({ unableToRead, missingCharacterId, missingUserId, moved, updated });
}

const recursive = process.argv.includes("--recursive");

main({ recursive });
