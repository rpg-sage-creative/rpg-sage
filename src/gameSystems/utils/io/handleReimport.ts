import type { CharacterBase, CharacterBaseCore } from "@rsc-utils/game-utils";
import { error } from "@rsc-utils/core-utils";
import { isInvalidWebhookUsername } from "@rsc-utils/discord-utils";
import type { Message } from "discord.js";
import type { SageCommand } from "../../../sage-lib/sage/model/SageCommand.js";
import { type FetchResult } from "./fetchCores.js";
import { handleImportErrors } from "./handleImportErrors.js";

type ReimportHandlers<T extends CharacterBaseCore, U extends CharacterBase<T>> = {
	loadCharacter: (id: string) => Promise<U | null>;

	fetchCore: (sageCommand: SageCommand) => Promise<FetchResult<T> | undefined>;

	updateSheet: (sageCommand: SageCommand, char: U, message: Message) => Promise<void>;
};

export async function handleReimport
		<T extends CharacterBaseCore, U extends CharacterBase<T>>
		(sageCommand: SageCommand, message: Message, characterId: string, handlers: ReimportHandlers<T, U>): Promise<void> {

	await sageCommand.replyStack.startThinking();

	const newName = sageCommand.args.getString("name") ?? undefined;
	if (newName) {
		// we only need to validate the name if it is new
		const invalidName = isInvalidWebhookUsername(newName);
		if (invalidName) {
			if (invalidName === true) {
				return handleImportErrors(sageCommand, "REIMPORT", [{ error:"USERNAME_TOO_LONG", invalidName:newName }]);
			}
			return handleImportErrors(sageCommand, "REIMPORT", [{ error:"USERNAME_S_BANNED", invalidName:newName }]);
		}
	}

	// look for old character
	const character = await handlers.loadCharacter(characterId);
	if (!character) {
		return handleImportErrors(sageCommand, "REIMPORT", [{ error:"INVALID_EXISTING_ID" }]);
	}


	// fetch new core
	const result = await handlers.fetchCore(sageCommand);

	// handle errors or no results
	if (!result) {
		return handleImportErrors(sageCommand, "REIMPORT", []);
	}else if (result.error) {
		return handleImportErrors(sageCommand, "REIMPORT", [result]);
	}

	const newCore = result.core;

	// check names
	const newCoreName = newCore.names?.name;
	if (character.name !== newCoreName && newCoreName !== newName) {
		return handleImportErrors(sageCommand, "REIMPORT", [{ error:"CHARACTER_NAME_MISMATCH" }]);
	}

	newCore.id = character.id;
	newCore.characterId = character.characterId;
	newCore.sheetRef = character.sheetRef;
	newCore.userId = character.userId;

	const characterClass = character.constructor as (new (core: T) => U);

	const newClass = new characterClass(newCore);
	const saved = await newClass.save();
	if (saved) {
		await handlers.updateSheet(sageCommand, newClass, message);
	}else {
		error(`Error saving reimported character:`, result);
		const localizer = sageCommand.getLocalizer();
		await sageCommand.replyStack.whisper(localizer("SORRY_WE_DONT_KNOW"));
	}

	if (sageCommand.isSageMessage()) {
		await sageCommand.message.delete();
	}

	await sageCommand.replyStack.stopThinking();
}