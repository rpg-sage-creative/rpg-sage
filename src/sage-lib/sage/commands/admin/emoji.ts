import { errorReturnNull } from "@rsc-utils/console-utils";
import { isDefined } from "@rsc-utils/type-utils";
import { discordPromptYesNo } from "../../../discord/prompts.js";
import type { Emoji, TEmojiAndType } from "../../model/Emoji.js";
import type { Game } from "../../model/Game.js";
import { EmojiType } from "../../model/HasEmojiCore.js";
import type { SageCommand } from "../../model/SageCommand.js";
import type { SageMessage } from "../../model/SageMessage.js";
import type { Server } from "../../model/Server.js";
import { registerAdminCommand } from "../cmd.js";
import { BotServerGameType } from "../helpers/BotServerGameType.js";

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
	return which === BotServerGameType.Server ? sageMessage.bot.emoji : sageMessage.server.emoji;
}

function getWhichEntity(sageMessage: SageMessage, which: BotServerGameType): Server | Game | undefined {
	return which === BotServerGameType.Server ? sageMessage.server : sageMessage.game;
}

async function _emojiList(sageMessage: SageMessage, which: BotServerGameType, canSync: boolean): Promise<void> {
	const emoji = getEmoji(sageMessage, which);
	let render = emoji.size > 0;
	if (!render) {
		if (which !== BotServerGameType.Bot && canSync) {
			const prompt = `**No ${getEmojiName(which)} Emoji Found!**\n> Sync with ${getOtherName(which)}?`;
			const booleanResponse = await discordPromptYesNo(sageMessage, prompt).catch(errorReturnNull);
			if (booleanResponse) {
				emoji.sync(getOtherEmoji(sageMessage, which));
				render = await getWhichEntity(sageMessage, which)?.save() ?? false;
			}
		}
		if (!render) {
			return sageMessage.whisper(`Sorry, there was an error getting Emoji.`);
		}
	}

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

async function emojiListBot(sageMessage: SageMessage): Promise<void> {
	await _emojiList(sageMessage, BotServerGameType.Bot, sageMessage.isSuperUser);
}

async function emojiListServer(sageMessage: SageMessage): Promise<void> {
	await _emojiList(sageMessage, BotServerGameType.Server, sageMessage.canAdminServer && sageMessage.testServerAdmin());
}

async function emojiListGame(sageMessage: SageMessage): Promise<void> {
	await _emojiList(sageMessage, BotServerGameType.Game, sageMessage.canAdminGame);
}

async function emojiList(sageMessage: SageMessage): Promise<void> {
	if (sageMessage.game) {
		return emojiListServer(sageMessage);
	}
	if (sageMessage.server) {
		return emojiListServer(sageMessage);
	}
	return emojiListBot(sageMessage);
}

//#endregion

//#region get

async function _emojiGet(sageMessage: SageMessage, ...emoji: Emoji[]): Promise<void> {
	emoji = emoji.filter(isDefined);

	const emojiType = sageMessage.args.getEnum(EmojiType, "type")!;
	let inherited = false;
	let _emoji = emoji.shift()!.get(emojiType);
	while (!_emoji && emoji.length) {
		inherited = true;
		_emoji = emoji.shift()!.get(emojiType);
	}
	if (!_emoji) {
		return sageMessage.whisper(`Sorry, you couldn't find an emoji type named: ${emojiType}`);
	}

	const inheritedText = inherited ? ` (unset, inherited)` : ``;
	await sageMessage.send(`${EmojiType[emojiType]} ${_emoji} ${inheritedText}`.trim());
	return Promise.resolve();
}

async function emojiGetBot(sageMessage: SageMessage): Promise<void> {
	if ([0, 5].includes(sageMessage.channel?.type!)) {
		return sageMessage.whisper(`Sorry, you aren't allowed to view Bot emoji in this channel.`);
	}
	return _emojiGet(sageMessage, sageMessage.bot.emoji);
}

async function emojiGetServer(sageMessage: SageMessage): Promise<void> {
	if ([0, 5].includes(sageMessage.channel?.type!)) {
		return sageMessage.whisper(`Sorry, you aren't allowed to view Server emoji in this channel.`);
	}
	return _emojiGet(sageMessage, sageMessage.server?.emoji, sageMessage.bot.emoji);
}

async function emojiGetGame(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminGame && !sageMessage.isPlayer) {
		return sageMessage.whisper(`Sorry, you aren't allowed to access this Game.`);
	}
	if ([0, 5].includes(sageMessage.channel?.type!)) {
		return sageMessage.whisper(`Sorry, you aren't allowed to view Game emoji in this channel.`);
	}
	return _emojiGet(sageMessage, sageMessage.game?.emoji!, sageMessage.server?.emoji, sageMessage.bot.emoji);
}

async function emojiGet(sageMessage: SageMessage): Promise<void> {
	if (sageMessage.game) {
		return emojiGetGame(sageMessage);
	}
	if (sageMessage.server) {
		return emojiGetServer(sageMessage);
	}
	return emojiGetBot(sageMessage);
}

//#endregion

//#region set

function getEmojiAndType(sageCommand: SageCommand): TEmojiAndType | undefined {
	const replacement = sageCommand.args.getString("emoji");
	const type = sageCommand.args.getEnum(EmojiType, "type");
	if (replacement && isDefined(type)) {
		return { replacement, type };
	}

	if (sageCommand.isSageMessage()) {
		if (type) {
			const nonKeyEmoji = sageCommand.args.nonKeyValuePairs().join(" ").trim();
			if (nonKeyEmoji) {
				return { replacement:nonKeyEmoji, type };
			}
		}
		if (replacement) {
			const nonKeyType = sageCommand.args.findEnum(EmojiType);
			if (isDefined(nonKeyType)) {
				return { replacement, type:nonKeyType };
			}
		}
	}

	return undefined;
}

async function emojiSetServer(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminServer) {
		return sageMessage.whisper(`Sorry, you aren't allowed to change Server emoji.`);
	}
	if (!sageMessage.testServerAdmin()) {
		return sageMessage.whisper(`Sorry, you aren't allowed to change Server emoji in this channel.`);
	}

	const emojiAndType = getEmojiAndType(sageMessage);
	if (!emojiAndType) {
		return sageMessage.whisper(`Please see Help for [Emoji Management](<https://github.com/rpg-sage-creative/rpg-sage/wiki/Emoji-Management>).`);
	}

	const set = sageMessage.server.emoji.set(emojiAndType);
	if (!set) {
		return sageMessage.whisper(`Sorry, we were unable set your emoji!`);
	}

	const saved = await sageMessage.server.save();
	if (!saved) {
		return sageMessage.whisper(`Sorry, we were unable set your emoji!`);
	}

	return sageMessage.reply({ content:`${EmojiType[emojiAndType.type]} ${emojiAndType.replacement}` });
}

async function emojiSetGame(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminGame) {
		return sageMessage.whisper(`Sorry, you aren't allowed to change Game emoji.`);
	}

	const emojiAndType = getEmojiAndType(sageMessage);
	if (!emojiAndType) {
		return sageMessage.whisper(`Please see Help for [Emoji Management](<https://github.com/rpg-sage-creative/rpg-sage/wiki/Emoji-Management>).`);
	}

	const set = sageMessage.game!.emoji.set(emojiAndType);
	if (!set) {
		return sageMessage.whisper(`Sorry, we were unable set your emoji!`);
	}

	const saved = await sageMessage.game!.save();
	if (!saved) {
		return sageMessage.whisper(`Sorry, we were unable set your emoji!`);
	}

	return sageMessage.reply({ content:`${EmojiType[emojiAndType.type]} ${emojiAndType.replacement}` });
}

async function emojiSet(sageMessage: SageMessage): Promise<void> {
	return sageMessage.game ? emojiSetGame(sageMessage) : emojiSetServer(sageMessage);
}

//#endregion

//#region sync

async function emojiSyncServer(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminServer) {
		return sageMessage.whisper(`Sorry, you aren't allowed to change Server emoji.`);
	}
	if (!sageMessage.testServerAdmin()) {
		return sageMessage.whisper(`Sorry, you aren't allowed to change Server emoji in this channel.`);
	}

	const server = sageMessage.server;

	const booleanResponse = await discordPromptYesNo(sageMessage, "> Sync emoji with Sage?");
	if (booleanResponse) {
		server.emoji.sync(sageMessage.bot.emoji);
		const saved = await server.save();
		if (!saved) {
			return sageMessage.whisper(`Sorry, we were unable sync your emoji!`);
		} else {
			return emojiListServer(sageMessage);
		}
	}
	return Promise.resolve();
}

async function emojiSyncGame(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminGame) {
		return sageMessage.whisper(`Sorry, you aren't allowed to change Game emoji.`);
	}

	const game = sageMessage.game!;

	const booleanResponse = await discordPromptYesNo(sageMessage, "> Sync emoji with Server?");
	if (booleanResponse) {
		game.emoji.sync(game.server.emoji);
		const saved = await game.save();
		if (!saved) {
			return sageMessage.whisper(`Sorry, we were unable sync your emoji!`);
		} else {
			return emojiListGame(sageMessage);
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
		return sageMessage.whisper(`Sorry, you aren't allowed to change Server emoji.`);
	}
	if (!sageMessage.testServerAdmin()) {
		return sageMessage.whisper(`Sorry, you aren't allowed to change Server emoji in this channel.`);
	}

	const emojiType = sageMessage.args.getEnum(EmojiType, "type")!;
	const unset = sageMessage.server.emoji.unset(emojiType);
	if (!unset) {
		return sageMessage.whisper(`Sorry, we were unable unset your emoji!`);
	}

	const saved = await sageMessage.server.save();
	if (!saved) {
		return sageMessage.whisper(`Sorry, we were unable unset your emoji!`);
	}

	return sageMessage.reactSuccess();
}

async function emojiUnsetGame(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminGame) {
		return sageMessage.whisper(`Sorry, you aren't allowed to change Game emoji.`);
	}

	const game = sageMessage.game!;

	const emojiType = sageMessage.args.getEnum(EmojiType, "type")!;
	const unset = game.emoji.unset(emojiType);
	if (!unset) {
		return sageMessage.whisper(`Sorry, we were unable unset your emoji!`);
	}

	const saved = await game.save();
	if (!saved) {
		return sageMessage.whisper(`Sorry, we were unable unset your emoji!`);
	}

	return sageMessage.reactSuccess();
}

async function emojiUnset(sageMessage: SageMessage): Promise<void> {
	return sageMessage.game ? emojiUnsetGame(sageMessage) : emojiUnsetServer(sageMessage);
}

//#endregion

export function registerEmoji(): void {
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
}
