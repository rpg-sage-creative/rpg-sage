import type { Optional } from "../../../../sage-utils";
import { exists } from "../../../../sage-utils/utils/ArrayUtils/Filters";
import { errorReturnNull } from "../../../../sage-utils/utils/ConsoleUtils/Catchers";
import { createEmojiRegex } from "../../../../sage-utils/utils/DiscordUtils/emoji";
import { discordPromptYesNo } from "../../../discord/prompts";
import type { TEmojiAndType } from "../../model/Emoji";
import type Emoji from "../../model/Emoji";
import type Game from "../../model/Game";
import { EmojiType } from "../../model/HasEmojiCore";
import type SageMessage from "../../model/SageMessage";
import type SageMessageArgs from "../../model/SageMessageArgs";
import type Server from "../../model/Server";
import { BotServerGameType, registerAdminCommand } from "../cmd";
import { registerAdminCommandHelp } from "../help";

//#region list

function getEmoji(sageMessage: SageMessage, which: BotServerGameType): Emoji {
	if (which === BotServerGameType.Game && sageMessage.game) {
		return sageMessage.game.emoji;
	}
	if (which !== BotServerGameType.Bot && sageMessage.server) {
		return sageMessage.server.emoji;
	}
	return sageMessage.bot.emoji;
}

async function _emojiList(sageMessage: SageMessage, which: BotServerGameType): Promise<void> {
	const emoji = getEmoji(sageMessage, which);
	let render = emoji.size > 0;
	if (!render) {
		if (which !== BotServerGameType.Bot) {
			const emojiName = which === BotServerGameType.Server ? "Server" : "Game";
			const otherName = which === BotServerGameType.Server ? "Sage" : "Server";
			const prompt = `**No ${emojiName} Emoji Found!**\n> Sync with ${otherName}?`;
			const booleanResponse = await discordPromptYesNo(sageMessage, prompt).catch(errorReturnNull);
			if (booleanResponse) {
				const otherEmoji = (which === BotServerGameType.Server ? sageMessage.bot : sageMessage.server ?? sageMessage.bot).emoji;
				emoji.sync(otherEmoji);
				const whichEntity = which === BotServerGameType.Server ? sageMessage.server : sageMessage.game;
				render = await whichEntity?.save() ?? false;
			}
		}
		if (!render) {
			return sageMessage.reactError("Unknown Error rendering Emoji List");
		}
	}

	if (render) {
		const botEmoji = sageMessage.bot.emoji.toArray();
		const text = botEmoji.map(_emoji => {
			let thisEmoji = emoji.toArray().find(e => e.type === _emoji.type);
			let inherited = false;
			if (!thisEmoji && which === BotServerGameType.Game) {
				inherited = true;
				thisEmoji = getEmoji(sageMessage, BotServerGameType.Server).toArray().find(e => e.type === _emoji.type);
			}
			if (!thisEmoji) {
				inherited = true;
				thisEmoji = _emoji;
			}
			const matchesText = thisEmoji.matches ? `(${thisEmoji.matches.join(", ")})` : ``;
			const inheritedText = inherited ? `(unset, inherited)` : ``;
			return `${thisEmoji.replacement} ${EmojiType[thisEmoji.type]} ${matchesText} ${inheritedText}`.trim();
		}).join("\n");
		return <any>sageMessage.send(text);
	}

	return Promise.resolve();
}

async function emojiListBot(sageMessage: SageMessage): Promise<void> {
	return _emojiList(sageMessage, BotServerGameType.Bot);
}

async function emojiListServer(sageMessage: SageMessage): Promise<void> {
	return _emojiList(sageMessage, BotServerGameType.Server);
}

async function emojiListGame(sageMessage: SageMessage): Promise<void> {
	return _emojiList(sageMessage, BotServerGameType.Game);
}

async function emojiList(sageMessage: SageMessage): Promise<void> {
	return sageMessage.game ? emojiListGame(sageMessage) : sageMessage.server ? emojiListServer(sageMessage) : emojiListBot(sageMessage);
}

//#endregion

//#region get

async function _emojiGet(sageMessage: SageMessage, ...emoji: Optional<Emoji>[]): Promise<void> {
	emoji = emoji.filter(exists);

	const emojiType = sageMessage.args.findEnum<EmojiType>(EmojiType, "type", true)!;
	let inherited = false;
	let _emoji = emoji.shift()!.get(emojiType);
	while (!_emoji && emoji.length) {
		inherited = true;
		_emoji = emoji.shift()!.get(emojiType);
	}
	if (!_emoji) {
		const attemptedEmoji = EmojiType[emojiType] ?? sageMessage.args[0];
		return sageMessage.reactFailure(`Unable to find Emoji: ${attemptedEmoji}`);
	}

	const inheritedText = inherited ? ` (unset, inherited)` : ``;
	await sageMessage.send(`${EmojiType[emojiType]} ${_emoji} ${inheritedText}`.trim());
}

async function emojiGetBot(sageMessage: SageMessage): Promise<void> {
	return _emojiGet(sageMessage, sageMessage.bot.emoji);
}

async function emojiGetServer(sageMessage: SageMessage): Promise<void> {
	return _emojiGet(sageMessage, sageMessage.server?.emoji, sageMessage.bot.emoji);
}

async function emojiGetGame(sageMessage: SageMessage): Promise<void> {
	return _emojiGet(sageMessage, sageMessage.game?.emoji!, sageMessage.server?.emoji!, sageMessage.bot.emoji);
}

async function emojiGet(sageMessage: SageMessage): Promise<void> {
	return sageMessage.game ? emojiGetGame(sageMessage) : sageMessage.server ? emojiGetServer(sageMessage) : emojiGetBot(sageMessage);
}

//#endregion

//#region set

/**
 * Returns both color and type from the args.
 * @todo ensure any calls to this expect the color and type to be keyed so that we can stop falling through to unkeyed args.
 */
function findEmojiAndType(args: SageMessageArgs): Optional<TEmojiAndType> {
	if (args.isEmpty) {
		return null;
	}
	const type = args.findEnum<EmojiType>(EmojiType, "type", true);
	const replacement = args.getString("emoji") ?? args.unkeyedValues().find(value => value.match(createEmojiRegex()));
	if (replacement && type) {
		return { replacement, type };
	}
	if (replacement === undefined && type === undefined) {
		return undefined;
	}
	return null;
}

async function emojiSetServer(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.checkCanAdminServer()) {
		return sageMessage.reactBlock("Set Server Emoji");
	}

	const server = sageMessage.server;

	const emojiAndType = findEmojiAndType(sageMessage.args);
	if (!emojiAndType) {
		return sageMessage.reactFailure("Missing emoji or type values.");
	}

	const set = server.emoji.set(emojiAndType.type, emojiAndType.replacement);
	if (!set) {
		return sageMessage.reactFailure("Invalid emoji or type values.");
	}

	const saved = await server.save();
	if (saved) {
		await sageMessage.send(`${EmojiType[emojiAndType.type]} ${emojiAndType.replacement}`);
		return;
	}
	return sageMessage.reactFailure("Unknown Error; Server Emoji NOT Set!");
}

async function emojiSetGame(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.checkCanAdminGame()) {
		return sageMessage.reactBlock("Set Game Emoji");
	}

	const game = sageMessage.game!;

	const emojiAndType = findEmojiAndType(sageMessage.args);
	if (!emojiAndType) {
		return sageMessage.reactFailure("Missing emoji or type values.");
	}

	const set = game.emoji.set(emojiAndType.type, emojiAndType.replacement);
	if (!set) {
		return sageMessage.reactFailure("Invalid emoji or type values.");
	}

	const saved = await game.save();
	if (saved) {
		await sageMessage.send(`${EmojiType[emojiAndType.type]} ${emojiAndType.replacement}`);
		return;
	}
	return sageMessage.reactFailure("Unknown Error; Game Emoji NOT Set!");
}

async function emojiSet(sageMessage: SageMessage): Promise<void> {
	return sageMessage.game ? emojiSetGame(sageMessage) : emojiSetServer(sageMessage);
}

//#endregion

//#region sync

async function emojiSyncServer(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.checkCanAdminServer()) {
		return sageMessage.denyForCanAdminServer("Sync Server Emoji");
	}

	const server = sageMessage.server;

	const booleanResponse = await discordPromptYesNo(sageMessage, "> Sync emoji with Sage?");
	if (booleanResponse) {
		server.emoji.sync(sageMessage.bot.emoji);
		const saved = await server.save();
		if (!saved) {
			return sageMessage.reactError("Unable to save Server.");
		} else {
			return emojiListServer(sageMessage);
		}
	}
	return Promise.resolve();
}

async function emojiSyncGame(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.checkCanAdminGame()) {
		return sageMessage.denyForCanAdminGame("Sync Game Emoji");
	}

	const game = sageMessage.game!;

	const booleanResponse = await discordPromptYesNo(sageMessage, "> Sync emoji with Server?");
	if (booleanResponse) {
		game.emoji.sync(game.server.emoji);
		const saved = await game.save();
		if (!saved) {
			sageMessage.reactError("Unable to save Game.");
		} else {
			emojiListGame(sageMessage);
		}
	}

	return Promise.resolve();
}

async function emojiSync(sageMessage: SageMessage): Promise<void> {
	return sageMessage.game ? emojiSyncGame(sageMessage) : emojiSyncServer(sageMessage);
}

//#endregion

//#region unset

async function _emojiUnset(sageMessage: SageMessage, which: Game | Server): Promise<void> {
	const emojiType = sageMessage.args.findEnum<EmojiType>(EmojiType, "type", true);
	const unset = exists(emojiType) ? which.emoji.unset(emojiType) : false;
	if (!unset) {
		return sageMessage.reactFailure("Invalid emoji type.");
	}
	const saved = await which.save();
	return sageMessage.reactSuccessOrFailure(saved, `${which.objectType} Emoji Unset`, `Unknown Error; ${which.objectType} Emoji NOT Unset!`);
}

async function emojiUnsetServer(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.checkCanAdminServer()) {
		return sageMessage.denyForCanAdminServer("Unset Server Emoji");
	}
	return _emojiUnset(sageMessage, sageMessage.server);
}

async function emojiUnsetGame(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.checkCanAdminGame()) {
		return sageMessage.denyForCanAdminGame("Unset Game Emoji");
	}
	return _emojiUnset(sageMessage, sageMessage.game);
}

async function emojiUnset(sageMessage: SageMessage): Promise<void> {
	return sageMessage.game ? emojiUnsetGame(sageMessage) : emojiUnsetServer(sageMessage);
}

//#endregion

export default function register(): void {
	registerAdminCommand(emojiListBot, "emoji-list-bot");
	registerAdminCommand(emojiListServer, "emoji-list-server");
	registerAdminCommand(emojiListGame, "emoji-list-game");
	registerAdminCommand(emojiList, "emoji-list");

	registerAdminCommand(emojiGetBot, "emoji-get-bot");
	registerAdminCommand(emojiGetServer, "emoji-get-server");
	registerAdminCommand(emojiGetGame, "emoji-get-game");
	registerAdminCommand(emojiGet, "emoji-get");

	registerAdminCommand(emojiSetServer, "emoji-set-server");
	registerAdminCommand(emojiSetGame, "emoji-set-game");
	registerAdminCommand(emojiSet, "emoji-set");

	registerAdminCommand(emojiSyncServer, "emoji-sync-server");
	registerAdminCommand(emojiSyncGame, "emoji-sync-game");
	registerAdminCommand(emojiSync, "emoji-sync");

	registerAdminCommand(emojiUnsetServer, "emoji-unset-server");
	registerAdminCommand(emojiUnsetGame, "emoji-unset-game");
	registerAdminCommand(emojiUnset, "emoji-unset");

	registerAdminCommandHelp("Admin", "Emoji", "emoji get {EmojiType}");
	registerAdminCommandHelp("Admin", "Emoji", "emoji get game {EmojiType}");
	registerAdminCommandHelp("Admin", "Emoji", "emoji get server {EmojiType}");

	registerAdminCommandHelp("Admin", "Emoji", "emoji list");
	registerAdminCommandHelp("Admin", "Emoji", "emoji list game");
	registerAdminCommandHelp("Admin", "Emoji", "emoji list server");

	registerAdminCommandHelp("Admin", "Emoji", "emoji set type=\"EmojiType\" value=\"emoji\"");
	registerAdminCommandHelp("Admin", "Emoji", "emoji set game type=\"EmojiType\" value=\"emoji\"");
	registerAdminCommandHelp("Admin", "Emoji", "emoji set server type=\"EmojiType\" value=\"emoji\"");

	registerAdminCommandHelp("Admin", "Emoji", "emoji sync");
	registerAdminCommandHelp("Admin", "Emoji", "emoji sync game");
	registerAdminCommandHelp("Admin", "Emoji", "emoji sync server");

	registerAdminCommandHelp("Admin", "Emoji", "emoji unset type=\"EmojiType\"");
	registerAdminCommandHelp("Admin", "Emoji", "emoji unset game type=\"EmojiType\"");
	registerAdminCommandHelp("Admin", "Emoji", "emoji unset server type=\"EmojiType\"");
}
