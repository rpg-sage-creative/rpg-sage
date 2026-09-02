import type { Message } from "discord.js";
import { PlayerCharacterE20 } from "../../../sage-e20/common/PlayerCharacterE20.js";
import { updateSheet } from "../../../sage-lib/sage/commands/e20.js";
import type { SageCommand } from "../../../sage-lib/sage/model/SageCommand.js";
import { handleReimport as _handleReimport } from "../../utils/io/handleReimport.js";
import { fetchCore } from "./fetchCore.js";

/** Processes the generic handleReimport() logic with E20 specific handlers. */
export async function handleReimport(sageCommand: SageCommand, message: Message, characterId: string): Promise<void> {
	const { loadCharacter } = PlayerCharacterE20;
	await _handleReimport(sageCommand, message, characterId, { loadCharacter, fetchCore, updateSheet, });
}