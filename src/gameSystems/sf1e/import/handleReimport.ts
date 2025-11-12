import type { Message } from "discord.js";
import { updateSheet } from "../../../sage-lib/sage/commands/hephaistos.js";
import type { SageCommand } from "../../../sage-lib/sage/model/SageCommand.js";
import { handleReimport as _handleReimport } from "../../utils/io/handleReimport.js";
import { HephaistosCharacterSF1e } from "../characters/HephaistosCharacter.js";
import { fetchCore } from "./fetchCore.js";

/*
	Future Streamlining potential!
	Put fetchCore, fetchCores, loadCharacter, postCharacter, and updateSheet on a single object.
	Register import/reimport for a "source" by passing that object.
	Or, simply have each "source" register these functions with a central object, and iterate it like an array to find the right functions.
*/

export async function handleReimport(sageCommand: SageCommand, message: Message, characterId: string): Promise<void> {
	const { loadCharacter } = HephaistosCharacterSF1e;
	await _handleReimport(sageCommand, message, characterId, { loadCharacter, fetchCore, updateSheet });
}