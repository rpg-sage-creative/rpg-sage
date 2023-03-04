import type { Optional } from "../../../../sage-utils";
import { exists } from "../../../../sage-utils/utils/ArrayUtils/Filters";
import { errorReturnNull } from "../../../../sage-utils/utils/ConsoleUtils/Catchers";
import { DiscordId } from "../../../discord";
import { discordPromptYesNo } from "../../../discord/prompts";
import type { TEmojiAndType } from "../../model/Emoji";
import type Emoji from "../../model/Emoji";
import { EmojiType } from "../../model/HasEmojiCore";
import type SageMessage from "../../model/SageMessage";
import type SageMessageArgs from "../../model/SageMessageArgs";
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
			return sageMessage.reactError();
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
	return sageMessage.isSuperUser ? _emojiList(sageMessage, BotServerGameType.Bot) : sageMessage.reactBlock();
}

async function emojiListServer(sageMessage: SageMessage): Promise<void> {
	return sageMessage.checkCanAdminServer() ? _emojiList(sageMessage, BotServerGameType.Server) : sageMessage.reactBlock();
}

async function emojiListGame(sageMessage: SageMessage): Promise<void> {
	return sageMessage.checkCanAdminGame() ? _emojiList(sageMessage, BotServerGameType.Game) : sageMessage.reactBlock();
}

async function emojiList(sageMessage: SageMessage): Promise<void> {
	return sageMessage.game ? emojiListGame(sageMessage) : sageMessage.server ? emojiListServer(sageMessage) : emojiListBot(sageMessage);
}

//#endregion

//#region get

async function _emojiGet(sageMessage: SageMessage, ...emoji: Emoji[]): Promise<void> {
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
	return <any>sageMessage.send(`${EmojiType[emojiType]} ${_emoji} ${inheritedText}`.trim());
}

async function emojiGetBot(sageMessage: SageMessage): Promise<void> {
	return sageMessage.isSuperUser ? _emojiGet(sageMessage, sageMessage.bot.emoji) : sageMessage.reactBlock();
}

async function emojiGetServer(sageMessage: SageMessage): Promise<void> {
	return sageMessage.checkCanAdminServer() ? _emojiGet(sageMessage, sageMessage.server?.emoji, sageMessage.bot.emoji) : sageMessage.reactBlock();
}

async function emojiGetGame(sageMessage: SageMessage): Promise<void> {
	return sageMessage.checkCanAdminGame() ? _emojiGet(sageMessage, sageMessage.game?.emoji!, sageMessage.server?.emoji!, sageMessage.bot.emoji) : sageMessage.reactBlock();
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
	const replacement = args.getString("emoji") ?? args.unkeyedValues().find(value => value.match(DiscordId.createEmojiRegex()));
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
		return sageMessage.reactBlock();
	}

	const server = sageMessage.server;

	const emojiAndType = findEmojiAndType(sageMessage.args);
	if (!emojiAndType) {
		return sageMessage.reactFailure();
	}

	const set = server.emoji.set(emojiAndType.type, emojiAndType.replacement);
	if (!set) {
		return sageMessage.reactFailure();
	}

	const saved = await server.save();
	sageMessage.reactSuccessOrFailure(saved);
	if (saved) {
		return <any>sageMessage.send(`${EmojiType[emojiAndType.type]} ${emojiAndType.replacement}`);
	}

	return Promise.resolve();
}

async function emojiSetGame(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.checkCanAdminGame()) {
		return sageMessage.reactBlock();
	}

	const game = sageMessage.game!;

	const emojiAndType = findEmojiAndType(sageMessage.args);
	if (!emojiAndType) {
		return sageMessage.reactFailure();
	}

	const set = game.emoji.set(emojiAndType.type, emojiAndType.replacement);
	if (!set) {
		return sageMessage.reactFailure();
	}

	const saved = await game.save();
	sageMessage.reactSuccessOrFailure(saved);
	if (saved) {
		return <any>sageMessage.send(`${EmojiType[emojiAndType.type]} ${emojiAndType.replacement}`);
	}

	return Promise.resolve();
}

async function emojiSet(sageMessage: SageMessage): Promise<void> {
	return sageMessage.game ? emojiSetGame(sageMessage) : emojiSetServer(sageMessage);
}

//#endregion

//#region sync

async function emojiSyncServer(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.checkCanAdminServer()) {
		return sageMessage.reactBlock();
	}

	const server = sageMessage.server;

	const booleanResponse = await discordPromptYesNo(sageMessage, "> Sync emoji with Sage?");
	if (booleanResponse) {
		server.emoji.sync(sageMessage.bot.emoji);
		const saved = await server.save();
		if (!saved) {
			return sageMessage.reactError();
		} else {
			return emojiListServer(sageMessage);
		}
	}
	return Promise.resolve();
}

async function emojiSyncGame(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.checkCanAdminGame()) {
		return sageMessage.reactBlock();
	}

	const game = sageMessage.game!;

	const booleanResponse = await discordPromptYesNo(sageMessage, "> Sync emoji with Server?");
	if (booleanResponse) {
		game.emoji.sync(game.server.emoji);
		const saved = await game.save();
		if (!saved) {
			sageMessage.reactError();
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

async function emojiUnsetServer(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.checkCanAdminServer()) {
		return sageMessage.reactBlock();
	}

	const emojiType = sageMessage.args.findEnum<EmojiType>(EmojiType, "type", true)!;
	const unset = sageMessage.server.emoji.unset(emojiType);
	if (!unset) {
		return sageMessage.reactFailure();
	}

	const saved = await sageMessage.server.save();
	return sageMessage.reactSuccessOrFailure(saved);
}

async function emojiUnsetGame(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.checkCanAdminGame()) {
		return sageMessage.reactBlock();
	}

	const game = sageMessage.game!;

	const emojiType = sageMessage.args.findEnum<EmojiType>(EmojiType, "type", true)!;
	const unset = game.emoji.unset(emojiType);
	if (!unset) {
		return sageMessage.reactFailure();
	}

	const saved = await game.save();
	sageMessage.reactSuccessOrFailure(saved);

	return Promise.resolve();
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

	registerAdminCommandHelp("Admin", "SuperUser", "Emoji", "emoji get bot {EmojiType}");
	registerAdminCommandHelp("Admin", "SuperUser", "Emoji", "emoji list bot");

	registerAdminCommandHelp("Admin", "Emoji", "emoji get {EmojiType}");
	registerAdminCommandHelp("Admin", "Emoji", "emoji get {server|game} {EmojiType}");

	registerAdminCommandHelp("Admin", "Emoji", "emoji list");
	registerAdminCommandHelp("Admin", "Emoji", "emoji list {server|game}");

	registerAdminCommandHelp("Admin", "Emoji", "emoji set {EmojiType} {emoji}");
	registerAdminCommandHelp("Admin", "Emoji", "emoji set {server|game} {EmojiType} {emoji}");

	registerAdminCommandHelp("Admin", "Emoji", "emoji sync");
	registerAdminCommandHelp("Admin", "Emoji", "emoji sync {server|game}");

	registerAdminCommandHelp("Admin", "Emoji", "emoji unset {EmojiType}");
	registerAdminCommandHelp("Admin", "Emoji", "emoji unset {server|game} {EmojiType}");
}
