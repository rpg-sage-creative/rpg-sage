import { error } from "@rsc-utils/core-utils";
import type { Message } from "discord.js";
import { updateSheet } from "../../../sage-lib/sage/commands/pathbuilder.js";
import type { SageCommand } from "../../../sage-lib/sage/model/SageCommand.js";
import { PathbuilderCharacter } from "../../../sage-pf2e/model/pc/PathbuilderCharacter.js";
import { handleFetchError } from "../../utils/fetchCore.js";
import { fetchCore } from "./fetchCore.js";

async function handleError(sageCommand: SageCommand, errorMessage: string): Promise<void> {
	const content = [
		`Reimport Error!`,
		`> ${errorMessage}`,
		`For information on reimporting characters, see our [wiki](<https://github.com/rpg-sage-creative/rpg-sage/wiki/Character-Management#importing-characters>)`,
	];
	await sageCommand.replyStack.whisper(content.join("\n"));
	await sageCommand.replyStack.stopThinking();
}

export async function handleReimport(sageCommand: SageCommand, message: Message, characterId: string): Promise<void> {
	await sageCommand.replyStack.startThinking();

	const newName = sageCommand.args.getString("name") ?? undefined;
	if (newName && /discord/i.test(newName)) {
		return handleError(sageCommand, `Due to Discord policy, you cannot have a username with "discord" in the name!`);
	}

	// look for old character
	const character = await PathbuilderCharacter.loadCharacter(characterId);
	if (!character) {
		return handleError(sageCommand, "Unable to find an imported character to update.");
	}

	// const importing = await sageCommand.replyStack.reply(`Reimporting ${newName ?? character.name ?? "<i>Unnamed Character</i>"} ...`, false);

	// fetch new core
	const result = await fetchCore(sageCommand);
	if (!result || !result.core) {
		// handle any errors
		if (result.error) {
			return handleFetchError(sageCommand, result, handleError);
		}

		return handleError(sageCommand, "Nothing to reimport.");
	}

	const newCore = result.core;

	// check names
	if (character.name !== newCore.name && newCore.name !== newName) {
		return handleError(sageCommand, "The character names do not match!");
	}

	newCore.id = character.id;
	newCore.characterId = character.characterId;
	newCore.sheetRef = character.sheetRef;
	newCore.userId = character.userId;

	const saved = await PathbuilderCharacter.saveCharacter(newCore);
	if (!saved) {
		error(`Error saving reimported character:`, result);
		return handleError(sageCommand, "Sorry, we don't know what went wrong!");
	}

	await updateSheet(sageCommand, new PathbuilderCharacter(newCore), message);

	// await importing?.delete();

	if (sageCommand.isSageMessage()) {
		await sageCommand.message.delete();
	}

	await sageCommand.replyStack.stopThinking();
}