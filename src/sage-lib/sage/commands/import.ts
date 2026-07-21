import { getActionRows } from "@rsc-utils/discord-utils";
import type { Message } from "discord.js";
import { handleImport as handleImportE20 } from "../../../gameSystems/e20/import/handleImport.js";
import { handleReimport as handleReimportE20 } from "../../../gameSystems/e20/import/handleReimport.js";
import { handleImport as handleImportP20 } from "../../../gameSystems/p20/import/handleImport.js";
import { handleReimport as handleReimportP20 } from "../../../gameSystems/p20/import/handleReimport.js";
import { handleImport as handleImportSF1e } from "../../../gameSystems/sf1e/import/handleImport.js";
import { handleReimport as handleReimportSF1e } from "../../../gameSystems/sf1e/import/handleReimport.js";
import { registerCommand } from "../../discord/handlers/registerCommand.js";
import { registerListeners } from "../../discord/handlers/registerListeners.js";
import type { SageMessage } from "../model/SageMessage.js";
import { parseValidCustomId as parseValidCustomIdE20 } from "./e20.js";
import { parseValidCustomId as parseValidCustomIdHEPH1E } from "./hephaistos.js";
import { parseValidCustomId as parseValidCustomIdPB2E } from "./pathbuilder.js";
import type { ParsedCustomId } from "./sheets/parseImportCharacterSheetCustomId.js";

// pb2eId=118142

/** Scans the components of a message to find one with a customId that matches a known import sheet control and with a valid characterId and command. */
async function findImportedCharacter(message: Message): Promise<ParsedCustomId | undefined> {
	const actionRows = getActionRows(message);
	for (const componentRow of actionRows) {
		for (const component of componentRow.components) {
			const customId = component.customId;

			// pathbuilder imports are most popular
			const pb2e = await parseValidCustomIdPB2E(customId);
			if (pb2e) {
				return pb2e;
			}

			// e20 imports are next most popular
			const e20 = await parseValidCustomIdE20(customId);
			if (e20) {
				return e20;
			}

			// heph is least
			const heph1e = await parseValidCustomIdHEPH1E(customId);
			if (heph1e) {
				return heph1e;
			}
		}
	}
	return undefined;
}

/** Sends the user information about where to find help with reimporting characters at the wiki. */
async function reimportHelp(sageCommand: SageMessage): Promise<void> {
	await sageCommand.whisper(sageCommand.getLocalizer()("REIMPORT_CHARACTERS_WIKI"));
}

/** Handles an attempt at reimporting a character. */
async function reimportHandler(sageCommand: SageMessage): Promise<void> {
	// no reference means no reply, means no link back to the character to reimport
	const reference = sageCommand.message.reference;
	if (!reference?.messageId) {
		return reimportHelp(sageCommand);
	}

	// no message, means no components to find the characterId
	const charMessage = await sageCommand.eventCache.fetchMessage(reference);
	if (!charMessage) {
		return reimportHelp(sageCommand);
	}

	const importedCharacter = await findImportedCharacter(charMessage);
	switch (importedCharacter?.characterType) {
		case "e20": return handleReimportE20(sageCommand, charMessage, importedCharacter.characterId);
		case "pb2e": return handleReimportP20(sageCommand, charMessage, importedCharacter.characterId);
		case "heph": return handleReimportSF1e(sageCommand, charMessage, importedCharacter.characterId);
		default: return reimportHelp(sageCommand);
	}

}

export function registerImport(): void {
	registerListeners({
		commands: ["import|essence20-pdf", "import|essence20", "import|e20"],
		interaction: handleImportE20,
		message: handleImportE20
	});
	registerListeners({
		commands: ["import|pathbuilder-2e", "import|pathfinder2e", "import|pf2e", "import|starfinder2e", "import|sf2e"],
		interaction: handleImportP20,
		message: handleImportP20
	});
	registerListeners({
		commands: ["import|starfinder1e", "import|sf1e"],
		interaction: handleImportSF1e,
		message: handleImportSF1e
	});
	registerCommand(reimportHandler, "reimport");
}
