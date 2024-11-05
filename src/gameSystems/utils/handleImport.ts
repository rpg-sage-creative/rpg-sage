import type { CharacterBase, CharacterBaseCore } from "@rsc-utils/character-utils";
import type { Optional } from "@rsc-utils/core-utils";
import type { MessageTarget } from "@rsc-utils/discord-utils";
import type { SageCommand } from "../../sage-lib/sage/model/SageCommand.js";
import { handleFetchError, type FetchResult } from "./fetchCore.js";
import { attachCharacter } from "./attachCharacter.js";

async function handleError(sageCommand: SageCommand, errorMessage: string): Promise<void> {
	const content = [
		`Import Error!`,
		`> ${errorMessage}`,
		`For information on importing characters, see our [wiki](<https://github.com/rpg-sage-creative/rpg-sage/wiki/Character-Management#importing-characters>)`,
	];
	await sageCommand.replyStack.whisper(content.join("\n"));
	await sageCommand.replyStack.stopThinking();
}

type HandleImportArgs<T extends CharacterBaseCore, U extends CharacterBase<T> = CharacterBase<T>> = {
	/** Fetches the core */
	fetchHandler: (sageCommand: SageCommand) => Promise<FetchResult<T>>;

	/** Attaches the character */
	attachHandler?: (sageCommand: SageCommand, channel: Optional<MessageTarget>, attachmentName: string, character: U, pin: boolean) => Promise<void>;

	/** Posts the character */
	postHandler: (sageCommand: SageCommand, channel: Optional<MessageTarget>, character: U, pin: boolean) => Promise<void>;
};

export async function handleImport<T extends CharacterBaseCore, U extends CharacterBase<T>>(sageCommand: SageCommand, args: HandleImportArgs<T, U>): Promise<void> {
	await sageCommand.replyStack.startThinking();

	const result = await args.fetchHandler(sageCommand);
	if (!result.core) {
		// notify of errors
		if (result.error) {
			return handleFetchError(sageCommand, result, handleError);
		}

		// notify of empty command
		return handleError(sageCommand, "Nothing to import.");
	}

	const char = result.char as U;

	// check name
	if (/discord/i.test(char.name)) {
		return handleError(sageCommand, `Due to Discord policy, you cannot have a username with "discord" in the name!`);
	}

	// const importing = await sageCommand.replyStack.reply(`Importing ${char.name ?? "<i>Unnamed Character</i>"} ...`, false);

	const channel = sageCommand.dChannel;
	const user = channel ? undefined : await sageCommand.sageCache.discord.fetchUser(sageCommand.sageUser.did);

	const pin = sageCommand.args.getBoolean("pin") ?? false;
	const attach = sageCommand.args.getBoolean("attach") ?? false;
	if (attach) {
		const name = char.name.replace(/\W+/g, "");
		const { attachHandler = attachCharacter } = args;
		await attachHandler(sageCommand, channel ?? user, `pathbuilder2e-${name}`, char, pin);

	}else {
		await args.postHandler(sageCommand, channel ?? user, char, pin);
	}

	// await importing?.delete();

	if (sageCommand.isSageInteraction()) {
		await sageCommand.replyStack.deleteReply();
	}

	await sageCommand.replyStack.stopThinking();
}