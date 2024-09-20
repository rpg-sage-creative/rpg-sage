import { errorReturnNull, getEnumValues, isDefined, parseEnum } from "@rsc-utils/core-utils";
import { registerListeners } from "../../../discord/handlers/registerListeners.js";
import { discordPromptYesNo } from "../../../discord/prompts.js";
import { Emoji, type TEmojiAndType } from "../../model/Emoji.js";
import type { Game } from "../../model/Game.js";
import { EmojiType } from "../../model/HasEmojiCore.js";
import type { SageCommand } from "../../model/SageCommand.js";
import type { SageMessage } from "../../model/SageMessage.js";
import type { Server } from "../../model/Server.js";
import { BotServerGameType } from "../helpers/BotServerGameType.js";

//#region args

function emojiGetTypes(sageMessage: SageMessage): EmojiType[] {

	// get emoji by key, where key is keyof EmojiType
	const types = sageMessage.args.toArray()
		.map(arg => parseEnum<EmojiType>(EmojiType, arg))
		.filter(isDefined);

	if (!types.length) {
		const type = sageMessage.args.getEnum(EmojiType, "type");
		if (isDefined(type)) types.push(type);
	}

	return types;
}

function getEmojiAndTypes(sageCommand: SageCommand): TEmojiAndType[] {
	const results: TEmojiAndType[] = [];

	// get emoji by key/value pair, where key is keyof EmojiType
	const types = getEnumValues<EmojiType>(EmojiType);
	types.forEach(type => {
		const replacement = sageCommand.args.getString(EmojiType[type]);
		if (replacement) {
			results.push({ replacement, type });
		}
	});

	// If none found, fall back to the old way of type="keyof EmojiType" and emoji="replacement"
	if (!results.length) {
		const replacement = sageCommand.args.getString("emoji");
		const type = sageCommand.args.getEnum(EmojiType, "type");
		if (replacement && isDefined(type)) {
			results.push({ replacement, type });
		}

		if (sageCommand.isSageMessage()) {
			if (type) {
				const nonKeyEmoji = sageCommand.args.nonKeyValuePairs().join(" ").trim();
				if (nonKeyEmoji) {
					results.push({ replacement:nonKeyEmoji, type });
				}
			}
			if (replacement) {
				const nonKeyType = sageCommand.args.findEnum(EmojiType);
				if (isDefined(nonKeyType)) {
					results.push({ replacement, type:nonKeyType });
				}
			}
		}
	}

	return results;
}

//#endregion

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

type RenderPair = { which:BotServerGameType; type:EmojiType; };
function renderEmoji(sageCommand: SageCommand, ...pairs: RenderPair[]): string {
	const output: string[] = [];

	for (const { which, type } of pairs) {
		const emoji = sageCommand.bot.emoji.findEmoji(type);
		if (!emoji || !which) {
			output.push(`Invalid EmojiType: ${type}`);
			continue;
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
		output.push(`${replacement} ${EmojiType[type]} ${matchesText} ${inheritedText}`.trim());
	}

	return output.join("\n");
}

async function _emojiList(sageMessage: SageMessage, which: BotServerGameType, canSync: boolean, ...types: EmojiType[]): Promise<void> {
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
	const filtered = types.length ? botEmoji.filter(_emoji => types.includes(_emoji.type)) : botEmoji;
	const content = `### RPG Sage ${BotServerGameType[which]} Emoji *(${filtered.length})*`;
	const text = renderEmoji(sageMessage, ...filtered.map(_emoji =>  ({ which, type:_emoji.type })));

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

async function emojiGetBot(sageMessage: SageMessage): Promise<void> {
	if ([0, 5].includes(sageMessage.channel?.type!)) {
		return sageMessage.whisper(`Sorry, you aren't allowed to view Bot emoji in this channel.`);
	}

	const types = emojiGetTypes(sageMessage);
	if (!types.length) {
		return sageMessage.whisperWikiHelp({ message:`Invalid EmojiType: ${sageMessage.args.getString("type")}.`, page:`Emoji Management` });
	}

	await _emojiList(sageMessage, BotServerGameType.Bot, sageMessage.isSuperUser, ...types);
}

async function emojiGetServer(sageMessage: SageMessage): Promise<void> {
	if ([0, 5].includes(sageMessage.channel?.type!)) {
		return sageMessage.whisper(`Sorry, you aren't allowed to view Server emoji in this channel.`);
	}

	const types = emojiGetTypes(sageMessage);
	if (!types.length) {
		return sageMessage.whisperWikiHelp({ message:`Invalid EmojiType: ${sageMessage.args.getString("type")}.`, page:`Emoji Management` });
	}

	await _emojiList(sageMessage, BotServerGameType.Server, sageMessage.canAdminServer && sageMessage.testServerAdmin(), ...types);
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

	const types = emojiGetTypes(sageMessage);
	if (!types.length) {
		return sageMessage.whisperWikiHelp({ message:`Invalid EmojiType: ${sageMessage.args.getString("type")}.`, page:`Emoji Management` });
	}

	await _emojiList(sageMessage, BotServerGameType.Game, sageMessage.canAdminGame, ...types);
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

async function emojiSetServer(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminServer) {
		return sageMessage.whisper(`Sorry, you aren't allowed to change Server emoji.`);
	}
	if (!sageMessage.testServerAdmin()) {
		return sageMessage.whisper(`Sorry, you aren't allowed to change Server emoji in this channel.`);
	}

	const emojiAndTypes = getEmojiAndTypes(sageMessage);
	if (!emojiAndTypes.length) {
		return sageMessage.whisperWikiHelp({ message:`Invalid Input.`, page:`Emoji Management` });
	}

	let changes = false;
	for (const emojiAndType of emojiAndTypes) {
		const matches = sageMessage.bot.emoji.findEmoji(emojiAndType.type)?.matches ?? [];
		const set = sageMessage.server.emoji.set({ ...emojiAndType, matches });
		changes ||= set;
	}
	if (!changes) {
		return sageMessage.whisper(`Sorry, we were unable set your emoji!`);
	}

	const saved = await sageMessage.server.save();
	if (!saved) {
		return sageMessage.whisper(`Sorry, we were unable set your emoji!`);
	}

	const which = BotServerGameType.Server;
	const types = emojiAndTypes.map(({ type }) => ({ which, type }));
	const label = `RPG Sage Server Emoji Updated (${types.length})`;
	const rendered = renderEmoji(sageMessage, ...types);
	const content = `${label}\n${rendered}`;
	return sageMessage.reply({ content });
}

async function emojiSetGame(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.game) {
		return sageMessage.whisper("Game not found.");
	}
	if (!sageMessage.canAdminGame) {
		return sageMessage.whisper(`Sorry, you aren't allowed to change Game emoji.`);
	}

	const emojiAndTypes = getEmojiAndTypes(sageMessage);
	if (!emojiAndTypes.length) {
		return sageMessage.whisperWikiHelp({ message:`Invalid Input.`, page:`Emoji Management` });
	}

	let changes = false;
	for (const emojiAndType of emojiAndTypes) {
		const matches = sageMessage.bot.emoji.findEmoji(emojiAndType.type)?.matches ?? [];
		const set = sageMessage.game.emoji.set({ ...emojiAndType, matches });
		changes ||= set;
	}
	if (!changes) {
		return sageMessage.whisper(`Sorry, we were unable set your emoji!`);
	}

	const saved = await sageMessage.game.save();
	if (!saved) {
		return sageMessage.whisper(`Sorry, we were unable set your emoji!`);
	}

	const which = BotServerGameType.Game;
	const types = emojiAndTypes.map(({ type }) => ({ which, type }));
	const label = `RPG Sage Game Emoji Updated (${types.length})`;
	const rendered = renderEmoji(sageMessage, ...types);
	const content = `${label}\n${rendered}`;
	return sageMessage.reply({ content });
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

	const types = emojiGetTypes(sageMessage);
	if (!types.length) {
		return sageMessage.whisperWikiHelp({ message:`Invalid EmojiType: ${sageMessage.args.getString("type")}.`, page:`Emoji Management` });
	}

	let changes = false;
	for (const type of types) {
		const unset = sageMessage.server.emoji.unset(type);
		changes ||= unset;
	}
	if (!changes) {
		return sageMessage.whisper(`Sorry, we were unable unset your emoji!`);
	}

	const saved = await sageMessage.server.save();
	if (!saved) {
		return sageMessage.whisper(`Sorry, we were unable unset your emoji!`);
	}

	const which = BotServerGameType.Server;
	const label = `RPG Sage Server Emoji Unset (${types.length})`;
	const rendered = renderEmoji(sageMessage, ...types.map(type => ({ which, type })));
	const content = `${label}\n${rendered}`;
	return sageMessage.reply({ content });
}

async function emojiUnsetGame(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.game) {
		return sageMessage.whisper("Game not found.");
	}
	if (!sageMessage.canAdminGame) {
		return sageMessage.whisper(`Sorry, you aren't allowed to change Game emoji.`);
	}

	const types = emojiGetTypes(sageMessage);
	if (!types.length) {
		return sageMessage.whisperWikiHelp({ message:`Invalid EmojiType: ${sageMessage.args.getString("type")}.`, page:`Emoji Management` });
	}

	let changes = false;
	for (const type of types) {
		const unset = sageMessage.game.emoji.unset(type);
		changes ||= unset;
	}
	if (!changes) {
		return sageMessage.whisper(`Sorry, we were unable unset your emoji!`);
	}

	const saved = await sageMessage.game.save();
	if (!saved) {
		return sageMessage.whisper(`Sorry, we were unable unset your emoji!`);
	}

	const which = BotServerGameType.Game;
	const label = `RPG Sage Game Emoji Unset (${types.length})`;
	const rendered = renderEmoji(sageMessage, ...types.map(type => ({ which, type })));
	const content = `${label}\n${rendered}`;
	return sageMessage.reply({ content });
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
