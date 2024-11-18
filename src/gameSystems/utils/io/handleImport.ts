import type { CharacterBase, CharacterBaseCore } from "@rsc-utils/character-utils";
import type { Optional } from "@rsc-utils/core-utils";
import type { MessageTarget } from "@rsc-utils/discord-utils";
import type { SageCommand } from "../../../sage-lib/sage/model/SageCommand.js";
import { attachCharacter as _attachCharacter } from "./attachCharacter.js";
import { type FetchResult } from "./fetchCores.js";
import { handleImportErrors } from "./handleImportErrors.js";

type ImportHandlers<T extends CharacterBaseCore, U extends CharacterBase<T> = CharacterBase<T>> = {
	/** Fetches the core */
	fetchCores: (sageCommand: SageCommand) => Promise<FetchResult<T>[]>;

	/** Attaches the character */
	attachCharacter?: (sageCommand: SageCommand, channel: Optional<MessageTarget>, character: U, pin: boolean) => Promise<void>;

	/** Posts the character */
	postCharacter: (sageCommand: SageCommand, channel: Optional<MessageTarget>, character: U, pin: boolean) => Promise<void>;
};

export async function handleImport
		<T extends CharacterBaseCore, U extends CharacterBase<T>>
		(sageCommand: SageCommand, handlers: ImportHandlers<T, U>): Promise<void> {

	await sageCommand.replyStack.startThinking();

	const channel = sageCommand.dChannel;
	const user = channel ? undefined : await sageCommand.sageCache.discord.fetchUser(sageCommand.sageUser.did);

	const pin = sageCommand.args.getBoolean("pin") ?? false;
	const attach = sageCommand.args.getBoolean("attach") ?? false;

	// fetch cores
	const results = await handlers.fetchCores(sageCommand);

	// iterate results
	for (const result of results) {
		// ignore results with errors
		if (result.error) {
			continue;
		}

		// process results with cores
		const char = result.char as U;
		if (attach) {
			const { attachCharacter = _attachCharacter } = handlers;
			await attachCharacter(sageCommand, channel ?? user, char, pin);

		}else {
			await handlers.postCharacter(sageCommand, channel ?? user, char, pin);
		}
	}

	// process all results with errors
	await handleImportErrors(sageCommand, results, "Import");

	// cleanup interaction reply
	if (sageCommand.isSageInteraction()) {
		await sageCommand.replyStack.deleteReply();
	}

	await sageCommand.replyStack.stopThinking();
}