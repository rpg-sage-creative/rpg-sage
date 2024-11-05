import type { CharacterBase, CharacterBaseCore } from "@rsc-utils/character-utils";
import { error } from "@rsc-utils/core-utils";
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
	if (newName && /discord/i.test(newName)) {
		return handleImportErrors(sageCommand, [{ error:"INVALID_NAME" }], "Reimport");
	}

	// look for old character
	const character = await handlers.loadCharacter(characterId);
	if (!character) {
		return handleImportErrors(sageCommand, [{ error:"INVALID_EXISTING_ID" }], "Reimport");
	}


	// fetch new core
	const result = await handlers.fetchCore(sageCommand);

	// handle errors or no results
	if (!result) {
		return handleImportErrors(sageCommand, [], "Reimport");
	}else if (result.error) {
		return handleImportErrors(sageCommand, [result], "Reimport");
	}

	const newCore = result.core;

	// check names
	if (character.name !== newCore.name && newCore.name !== newName) {
		return handleImportErrors(sageCommand, [{ error:"NAME_MISMATCH" }], "Reimport");
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
		await sageCommand.replyStack.whisper("Sorry, we don't know what went wrong!");
	}

	if (sageCommand.isSageMessage()) {
		await sageCommand.message.delete();
	}

	await sageCommand.replyStack.stopThinking();
}