import type { Message } from "discord.js";
import { updateSheet } from "../../../sage-lib/sage/commands/pathbuilder.js";
import type { SageCommand } from "../../../sage-lib/sage/model/SageCommand.js";
import { PathbuilderCharacter } from "../../../sage-pf2e/model/pc/PathbuilderCharacter.js";
import { handleReimport as _handleReimport } from "../../utils/io/handleReimport.js";
import { fetchCore } from "./fetchCore.js";

export async function handleReimport(sageCommand: SageCommand, message: Message, characterId: string): Promise<void> {
	const { loadCharacter } = PathbuilderCharacter;
	await _handleReimport(sageCommand, message, characterId, { loadCharacter, fetchCore, updateSheet });
}