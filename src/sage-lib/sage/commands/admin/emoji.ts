import { errorReturnNull } from "@rsc-utils/console-utils";
import { isDefined } from "@rsc-utils/type-utils";
import { registerListeners } from "../../../discord/handlers/registerListeners.js";
import { discordPromptYesNo } from "../../../discord/prompts.js";
import type { Emoji, TEmojiAndType } from "../../model/Emoji.js";
import type { Game } from "../../model/Game.js";
import { EmojiType, IEmoji } from "../../model/HasEmojiCore.js";
import type { SageCommand } from "../../model/SageCommand.js";
import type { SageMessage } from "../../model/SageMessage.js";
import type { Server } from "../../model/Server.js";
import { BotServerGameType } from "../helpers/BotServerGameType.js";

//#region list

function getEmoji(sageCommand: SageCommand, which: BotServerGameType): Emoji {
	if (which === BotServerGameType.Game && sageCommand.game) {
		return sageCommand.game.emoji;
	}
	if (which !== BotServerGameType.Bot && sageCommand.server) {
		return sageCommand.server.emoji;
	}
	return sageCommand.bot.emoji;
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

function renderEmoji(sageCommand: SageCommand, which: BotServerGameType, type: EmojiType): string {
	const emoji = sageCommand.bot.emoji.findEmoji(type);
	if (!emoji) {
		return `Invalid EmojiType: ${type}`;
	}

	let replacement = getEmoji(sageCommand, which).findEmoji(type)?.replacement;
	let inherited = false;
	if (!replacement && which === BotServerGameType.Game) {
		inherited = true;
		replacement = getEmoji(sageCommand, BotServerGameType.Server).findEmoji(type)?.replacement;
	}
	if (!replacement) {
		inherited = true;
		replacement = emoji.replacement;
	}

	const matchesText = emoji.matches ? emoji.matches.map(s => `\`[${s}]\``).join(", ") : ``;
	const inheritedText = inherited ? `*(unset, inherited)*` : ``;
	return `${replacement} ${EmojiType[type]} ${matchesText} ${inheritedText}`.trim();

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
			await sageMessage.whisper(`Sorry, there was an error getting Emoji.`);
			return;
		}
	}

	const botEmoji = sageMessage.bot.emoji.toArray();
	const content = `### RPG Sage ${BotServerGameType[which]} Emoji *(${botEmoji.length})*`;
	const text = botEmoji.map(_emoji => renderEmoji(sageMessage, which, _emoji.type)).join("\n");

	await sageMessage.send(`${content}\n${text}`);
}

async function emojiListBot(sageMessage: SageMessage): Promise<void> {
	await _emojiList(sageMessage, BotServerGameType.Bot, sageMessage.isSuperUser);
}

async function emojiListServer(sageMessage: SageMessage): Promise<void> {
	await _emojiList(sageMessage, BotServerGameType.Server, sageMessage.canAdminServer && sageMessage.testServerAdmin());
}

async function emojiListGame(sageMessage: SageMessage): Promise<void> {
	if (sageMessage.game) {
		await _emojiList(sageMessage, BotServerGameType.Game, sageMessage.canAdminGame);
	}else {
		await sageMessage.whisper("Game not found.");
	}
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

type WhichEmoji = { bot?:Emoji; server?:Emoji; game?:Emoji; };

async function _emojiGet(sageMessage: SageMessage, emojis: WhichEmoji): Promise<void> {
	const type = sageMessage.args.getEnum(EmojiType, "type");
	if (!isDefined(type)) {
		return sageMessage.whisperWikiHelp({ message:`Invalid EmojiType: ${sageMessage.args.getString("type")}.`, page:`Emoji Management` });
	}

	let emoji: IEmoji | undefined;
	let which: BotServerGameType;
	if (emojis.game) {
		emoji = emojis.game.findEmoji(type);
		which = BotServerGameType.Game;
	}
	if (!emoji && emojis.server) {
		emoji = emojis.server.findEmoji(type);
		which = BotServerGameType.Server;
	}
	if (!emoji && emojis.bot) {
		emoji = emojis.bot.findEmoji(type);
		which = BotServerGameType.Bot;
	}
	if (!emoji) {
		return sageMessage.whisperWikiHelp({ message:`Invalid EmojiType: ${sageMessage.args.getString("type")}.`, page:`Emoji Management` });
	}

	await sageMessage.reply({ content:renderEmoji(sageMessage, which!, type) });
	return Promise.resolve();
}

async function emojiGetBot(sageMessage: SageMessage): Promise<void> {
	if ([0, 5].includes(sageMessage.channel?.type!)) {
		return sageMessage.whisper(`Sorry, you aren't allowed to view Bot emoji in this channel.`);
	}
	return _emojiGet(sageMessage, { bot:sageMessage.bot.emoji });
}

async function emojiGetServer(sageMessage: SageMessage): Promise<void> {
	if ([0, 5].includes(sageMessage.channel?.type!)) {
		return sageMessage.whisper(`Sorry, you aren't allowed to view Server emoji in this channel.`);
	}
	return _emojiGet(sageMessage, { server:sageMessage.server?.emoji, bot:sageMessage.bot.emoji });
}

async function emojiGetGame(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.game) {
		return sageMessage.whisper("Game not found.");
	}
	if (!sageMessage.canAdminGame && !sageMessage.isPlayer) {
		return sageMessage.whisper(`Sorry, you aren't allowed to access this Game.`);
	}
	if ([0, 5].includes(sageMessage.channel?.type!)) {
		return sageMessage.whisper(`Sorry, you aren't allowed to view Game emoji in this channel.`);
	}
	return _emojiGet(sageMessage, { game:sageMessage.game?.emoji, server:sageMessage.server?.emoji, bot:sageMessage.bot.emoji });
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
		return sageMessage.whisperWikiHelp({ message:`Invalid Input.`, page:`Emoji Management` });
	}

	const matches = sageMessage.bot.emoji.findEmoji(emojiAndType.type)?.matches ?? [];
	const set = sageMessage.server.emoji.set({ ...emojiAndType, matches });
	if (!set) {
		return sageMessage.whisper(`Sorry, we were unable set your emoji!`);
	}

	const saved = await sageMessage.server.save();
	if (!saved) {
		return sageMessage.whisper(`Sorry, we were unable set your emoji!`);
	}

	return sageMessage.reply({ content:renderEmoji(sageMessage, BotServerGameType.Server, emojiAndType.type) });
}

async function emojiSetGame(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.game) {
		return sageMessage.whisper("Game not found.");
	}
	if (!sageMessage.canAdminGame) {
		return sageMessage.whisper(`Sorry, you aren't allowed to change Game emoji.`);
	}

	const emojiAndType = getEmojiAndType(sageMessage);
	if (!emojiAndType) {
		return sageMessage.whisperWikiHelp({ message:`Invalid Input.`, page:`Emoji Management` });
	}

	const matches = sageMessage.bot.emoji.findEmoji(emojiAndType.type)?.matches ?? [];
	const set = sageMessage.game!.emoji.set({ ...emojiAndType, matches });
	if (!set) {
		return sageMessage.whisper(`Sorry, we were unable set your emoji!`);
	}

	const saved = await sageMessage.game!.save();
	if (!saved) {
		return sageMessage.whisper(`Sorry, we were unable set your emoji!`);
	}

	return sageMessage.reply({ content:renderEmoji(sageMessage, BotServerGameType.Game, emojiAndType.type) });
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
	if (!sageMessage.game) {
		return sageMessage.whisper("Game not found.");
	}
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

	const type = sageMessage.args.getEnum(EmojiType, "type");
	if (!isDefined(type)) {
		return sageMessage.whisperWikiHelp({ message:`Invalid EmojiType: ${sageMessage.args.getString("type")}.`, page:`Emoji Management` });
	}

	const unset = sageMessage.server.emoji.unset(type);
	if (!unset) {
		return sageMessage.whisper(`Nothing to unset!`);
	}

	const saved = await sageMessage.server.save();
	if (!saved) {
		return sageMessage.whisper(`Sorry, we were unable unset your emoji!`);
	}

	return sageMessage.reply({ content:renderEmoji(sageMessage, BotServerGameType.Server, type) });
}

async function emojiUnsetGame(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.game) {
		return sageMessage.whisper("Game not found.");
	}
	if (!sageMessage.canAdminGame) {
		return sageMessage.whisper(`Sorry, you aren't allowed to change Game emoji.`);
	}

	const game = sageMessage.game!;

	const type = sageMessage.args.getEnum(EmojiType, "type");
	if (!isDefined(type)) {
		return sageMessage.whisperWikiHelp({ message:`Invalid EmojiType: ${sageMessage.args.getString("type")}.`, page:`Emoji Management` });
	}

	const unset = game.emoji.unset(type);
	if (!unset) {
		return sageMessage.whisper(`Nothing to unset!`);
	}

	const saved = await game.save();
	if (!saved) {
		return sageMessage.whisper(`Sorry, we were unable unset your emoji!`);
	}

	return sageMessage.reply({ content:renderEmoji(sageMessage, BotServerGameType.Game, type) });
}

async function emojiUnset(sageMessage: SageMessage): Promise<void> {
	return sageMessage.game ? emojiUnsetGame(sageMessage) : emojiUnsetServer(sageMessage);
}

//#endregion

export function registerEmoji(): void {
	registerListeners({ commands:["emoji|list|bot"], message:emojiListBot });
	registerListeners({ commands:["emoji|list|server"], message:emojiListServer });
	registerListeners({ commands:["emoji|list|game"], message:emojiListGame });
	registerListeners({ commands:["emoji|list"], message:emojiList });

	registerListeners({ commands:["emoji|get|bot"], message:emojiGetBot });
	registerListeners({ commands:["emoji|get|server"], message:emojiGetServer });
	registerListeners({ commands:["emoji|get|game"], message:emojiGetGame });
	registerListeners({ commands:["emoji|get"], message:emojiGet });

	registerListeners({ commands:["emoji|set|server"], message:emojiSetServer });
	registerListeners({ commands:["emoji|set|game"], message:emojiSetGame });
	registerListeners({ commands:["emoji|set"], message:emojiSet });

	registerListeners({ commands:["emoji|sync|server"], message:emojiSyncServer });
	registerListeners({ commands:["emoji|sync|game"], message:emojiSyncGame });
	registerListeners({ commands:["emoji|sync"], message:emojiSync });

	registerListeners({ commands:["emoji|unset|server"], message:emojiUnsetServer });
	registerListeners({ commands:["emoji|unset|game"], message:emojiUnsetGame });
	registerListeners({ commands:["emoji|unset"], message:emojiUnset });
}
