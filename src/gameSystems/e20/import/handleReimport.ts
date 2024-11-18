import type { Message } from "discord.js";
import { loadCharacter, updateSheet } from "../../../sage-lib/sage/commands/e20.js";
import type { SageCommand } from "../../../sage-lib/sage/model/SageCommand.js";
import { handleReimport as _handleReimport } from "../../utils/io/handleReimport.js";
import { fetchCore } from "./fetchCore.js";

export async function handleReimport(sageCommand: SageCommand, message: Message, characterId: string): Promise<void> {
	await _handleReimport(sageCommand, message, characterId, { loadCharacter, fetchCore, updateSheet, });
}