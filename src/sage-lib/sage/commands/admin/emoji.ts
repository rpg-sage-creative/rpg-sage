import utils from "../../../../sage-utils";
import { discordPromptYesNo } from "../../../discord/prompts";
import type Emoji from "../../model/Emoji";
import type Game from "../../model/Game";
import { EmojiType } from "../../model/HasEmojiCore";
import type SageMessage from "../../model/SageMessage";
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
function getEmojiName(which: BotServerGameType): string {
	return which === BotServerGameType.Server ? "Server" : "Game";
}
function getOtherName(which: BotServerGameType): string {
	return which === BotServerGameType.Server ? "Sage" : "Server";
}
function getOtherEmoji(sageMessage: SageMessage, which: BotServerGameType): Emoji {
	const server = sageMessage.server;
	if (server) {
		return which === BotServerGameType.Server ? sageMessage.bot.emoji : server.emoji;
	}
	return sageMessage.bot.emoji;
}
function getWhichEntity(sageMessage: SageMessage, which: BotServerGameType): Server | Game | undefined {
	return which === BotServerGameType.Server ? sageMessage.server : sageMessage.game;
}
async function _emojiList(sageMessage: SageMessage, which: BotServerGameType): Promise<void> {
	const emoji = getEmoji(sageMessage, which);
	let render = emoji.size > 0;
	if (!render) {
		if (which !== BotServerGameType.Bot) {
			const emojiName = getEmojiName(which);
			const otherName = getOtherName(which);
			const booleanResponse = await discordPromptYesNo(sageMessage, `**No ${emojiName} Emoji Found!**\n> Sync with ${otherName}?`).catch(utils.ConsoleUtils.Catchers.errorReturnNull);
			if (booleanResponse) {
				emoji.sync(getOtherEmoji(sageMessage, which));
				render = await getWhichEntity(sageMessage, which)?.save() ?? false;
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
	return sageMessage.canAdminServer && sageMessage.testServerAdmin() ? _emojiList(sageMessage, BotServerGameType.Server) : sageMessage.reactBlock();
}

async function emojiListGame(sageMessage: SageMessage): Promise<void> {
	return sageMessage.canAdminGame ? _emojiList(sageMessage, BotServerGameType.Game) : sageMessage.reactBlock();
}

async function emojiList(sageMessage: SageMessage): Promise<void> {
	return sageMessage.game ? emojiListGame(sageMessage) : sageMessage.server ? emojiListServer(sageMessage) : emojiListBot(sageMessage);
}

//#endregion

//#region get

async function _emojiGet(sageMessage: SageMessage, ...emoji: Emoji[]): Promise<void> {
	if (!sageMessage.isSuperUser) {
		return sageMessage.reactBlock();
	}

	emoji = emoji.filter(utils.ArrayUtils.Filters.exists);

	const emojiType = sageMessage.args.removeAndReturnEnum<EmojiType>(EmojiType)!;
	let inherited = false;
	let _emoji = emoji.shift()!.get(emojiType);
	while (!_emoji && emoji.length) {
		inherited = true;
		_emoji = emoji.shift()!.get(emojiType);
	}
	if (!_emoji) {
		return sageMessage.reactFailure();
	}

	const inheritedText = inherited ? ` (unset, inherited)` : ``;
	return <any>sageMessage.send(`${EmojiType[emojiType]} ${_emoji} ${inheritedText}`.trim());
}

async function emojiGetBot(sageMessage: SageMessage): Promise<void> {
	return sageMessage.isSuperUser ? _emojiGet(sageMessage, sageMessage.bot.emoji) : sageMessage.reactBlock();
}

async function emojiGetServer(sageMessage: SageMessage): Promise<void> {
	return sageMessage.canAdminServer && sageMessage.testServerAdmin() ? _emojiGet(sageMessage, sageMessage.server?.emoji, sageMessage.bot.emoji) : sageMessage.reactBlock();
}

async function emojiGetGame(sageMessage: SageMessage): Promise<void> {
	return sageMessage.canAdminGame ? _emojiGet(sageMessage, sageMessage.game?.emoji!, sageMessage.server?.emoji, sageMessage.bot.emoji) : sageMessage.reactBlock();
}

async function emojiGet(sageMessage: SageMessage): Promise<void> {
	return sageMessage.game ? emojiGetGame(sageMessage) : sageMessage.server ? emojiGetServer(sageMessage) : emojiGetBot(sageMessage);
}

//#endregion

//#region set

async function emojiSetServer(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminServer) {
		return sageMessage.reactBlock();
	}
	if (!sageMessage.testServerAdmin()) {
		return sageMessage.reactBlock();
	}

	const server = sageMessage.server;

	const emojiType = sageMessage.args.removeAndReturnEnum<EmojiType>(EmojiType) ?? null;
	const replacement = sageMessage.args.join("");
	if (emojiType === null || !replacement) {
		return sageMessage.reactFailure();
	}

	const set = server.emoji.set(emojiType, replacement);
	if (!set) {
		return sageMessage.reactFailure();
	}

	const saved = await server.save();
	sageMessage.reactSuccessOrFailure(saved);
	if (saved) {
		return <any>sageMessage.send(`${EmojiType[emojiType]} ${replacement}`);
	}
	return Promise.resolve();
}

async function emojiSetGame(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminGame) {
		return sageMessage.reactBlock();
	}

	const game = sageMessage.game!;

	const emojiType = sageMessage.args.removeAndReturnEnum<EmojiType>(EmojiType) ?? null;
	const replacement = sageMessage.args.join("");
	if (emojiType === null || !replacement) {
		return sageMessage.reactFailure();
	}

	const set = game.emoji.set(emojiType, replacement);
	if (!set) {
		return sageMessage.reactFailure();
	}

	const saved = await game.save();
	sageMessage.reactSuccessOrFailure(saved);
	if (saved) {
		return <any>sageMessage.send(`${EmojiType[emojiType]} ${replacement}`);
	}

	return Promise.resolve();
}

async function emojiSet(sageMessage: SageMessage): Promise<void> {
	return sageMessage.game ? emojiSetGame(sageMessage) : emojiSetServer(sageMessage);
}

//#endregion

//#region sync

async function emojiSyncServer(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminServer) {
		return sageMessage.reactBlock();
	}
	if (!sageMessage.testServerAdmin()) {
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
	if (!sageMessage.canAdminGame) {
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
	if (!sageMessage.canAdminServer) {
		return sageMessage.reactBlock();
	}
	if (!sageMessage.testServerAdmin()) {
		return sageMessage.reactBlock();
	}

	const emojiType = sageMessage.args.removeAndReturnEnum<EmojiType>(EmojiType)!;
	const unset = sageMessage.server.emoji.unset(emojiType);
	if (!unset) {
		return sageMessage.reactFailure();
	}

	const saved = await sageMessage.server.save();
	return sageMessage.reactSuccessOrFailure(saved);
}

async function emojiUnsetGame(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminGame) {
		return sageMessage.reactBlock();
	}

	const game = sageMessage.game!;

	const emojiType = sageMessage.args.removeAndReturnEnum<EmojiType>(EmojiType)!;
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
