import type { Message } from "discord.js";
import { handleImport as handleImportE20 } from "../../../gameSystems/e20/import/handleImport.js";
import { handleReimport as handleReimportE20 } from "../../../gameSystems/e20/import/handleReimport.js";
import { handleImport as handleImportP20 } from "../../../gameSystems/p20/import/handleImport.js";
import { handleReimport as handleReimportP20 } from "../../../gameSystems/p20/import/handleReimport.js";
import { registerCommand } from "../../discord/handlers/registerCommand.js";
import { registerListeners } from "../../discord/handlers/registerListeners.js";
import type { SageMessage } from "../model/SageMessage.js";
import { getValidE20CharacterId } from "./e20.js";
import { getValidPathbuilderCharacterId } from "./pathbuilder.js";

// pb2eId=118142

type ImportedCharacter = { id:string; type:"E20"|"PB2E"; };
function findImportedCharacter(message: Message): ImportedCharacter | undefined {
	for (const componentRow of message.components) {
		for (const component of componentRow.components) {
			const customId = component.customId;
			const pathbuilderCharacterId = getValidPathbuilderCharacterId(customId);
			if (pathbuilderCharacterId) {
				return { id:pathbuilderCharacterId, type:"PB2E" };
			}
			const e20CharacterId = getValidE20CharacterId(customId);
			if (e20CharacterId) {
				return { id:e20CharacterId, type:"E20" };
			}
		}
	}
	return undefined;
}

async function reimportHelp(sageCommand: SageMessage): Promise<void> {
	await sageCommand.whisper(sageCommand.getLocalizer()("REIMPORT_CHARACTERS_WIKI"));
}
async function reimportHandler(sageCommand: SageMessage): Promise<void> {
	// no reference means no reply, means no link back to the character to reimport
	const reference = sageCommand.message.reference;
	if (!reference?.messageId) {
		return reimportHelp(sageCommand);
	}

	// no message, means no components to find the characterId
	const charMessage = await sageCommand.sageCache.fetchMessage(reference);
	if (!charMessage) {
		return reimportHelp(sageCommand);
	}

	const importedCharacter = findImportedCharacter(charMessage);
	switch (importedCharacter?.type) {
		case "E20": return handleReimportE20(sageCommand, charMessage, importedCharacter.id);
		case "PB2E": return handleReimportP20(sageCommand, charMessage, importedCharacter.id);
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
	registerCommand(reimportHandler, "reimport");
}
