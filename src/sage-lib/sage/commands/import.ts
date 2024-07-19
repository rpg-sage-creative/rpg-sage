import { DiscordKey } from "@rsc-utils/discord-utils";
import type { Message } from "discord.js";
import { registerCommand } from "../../discord/handlers/registerCommand.js";
import { registerListeners } from "../../discord/handlers/registerListeners.js";
import type { SageMessage } from "../model/SageMessage.js";
import { getValidE20CharacterId, handleEssence20Import, handleEssence20Reimport } from "./e20.js";
import { getValidPathbuilderCharacterId, handlePathbuilder2eImport, handlePathbuilder2eReimport } from "./pathbuilder.js";

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
	await sageCommand.whisper("To reimport, please reply to your imported character sheet with:\n```sage!reimport id=\"\"```or```sage!reimport pdf=\"\"```");
}
async function reimportHandler(sageCommand: SageMessage): Promise<void> {
	// no reference means no reply, means no link back to the character to reimport
	const reference = sageCommand.message.reference;
	if (!reference?.messageId) {
		return reimportHelp(sageCommand);
	}

	// no message, means no components to find the characterId
	const discordKey = DiscordKey.from(reference);
	const charMessage = await sageCommand.sageCache.fetchMessage(discordKey);
	if (!charMessage) {
		return reimportHelp(sageCommand);
	}

	const importedCharacter = findImportedCharacter(charMessage);
	switch (importedCharacter?.type) {
		case "E20": return handleEssence20Reimport(sageCommand, charMessage, importedCharacter.id);
		case "PB2E": return handlePathbuilder2eReimport(sageCommand, charMessage, importedCharacter.id);
		default: return reimportHelp(sageCommand);
	}

}

export function registerImport(): void {
	registerListeners({ commands:["import|pathbuilder-2e"], interaction:handlePathbuilder2eImport, message:handlePathbuilder2eImport });
	registerListeners({ commands:["import|essence20-pdf"], interaction:handleEssence20Import, message:handleEssence20Import });
	registerCommand(reimportHandler, "reimport");
}
