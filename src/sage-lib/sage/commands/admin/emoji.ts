import { errorReturnUndefined, getEnumValues, isDefined } from "@rsc-utils/core-utils";
import { splitMessageOptions } from "@rsc-utils/discord-utils";
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

function getEmojiTypes(sageMessage: SageMessage): EmojiType[] {

	// get emoji by key, where key is keyof EmojiType
	const types = sageMessage.args.manager.enumValues(EmojiType);

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
		const replacement = sageCommand.args.getString(EmojiType[type])?.trim();
		if (replacement) {
			results.push({ replacement, type });
		}
	});

	// If none found, fall back to the old way of type="keyof EmojiType" and emoji="replacement"
	if (!results.length) {
		const replacement = sageCommand.args.getString("emoji")?.trim();
		const type = sageCommand.args.getEnum(EmojiType, "type");
		if (replacement && isDefined(type)) {
			results.push({ replacement, type });
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
	return which === BotServerGameType.Server ? sageMessage.bot.emoji : sageMessage.server?.emoji!;
}

function getWhichEntity(sageMessage: SageMessage, which: BotServerGameType): Server | Game | undefined {
	return which === BotServerGameType.Server ? sageMessage.server : sageMessage.game;
}

type RenderPair = { which:BotServerGameType; type:EmojiType; };

function renderEmoji(sageCommand: SageCommand, ...pairs: RenderPair[]): string {
	const output: string[] = [];

	for (const { which, type } of pairs) {
		const botEmoji = sageCommand.bot.emoji.findEmoji(type);
		if (!botEmoji) {
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
			replacement = botEmoji.replacement;
		}

		const inheritedText = inherited ? `*(unset, inherited)*` : ``;
		const matchesText = botEmoji.matches ? " " + botEmoji.matches.map(s => `\`[${s}]\``).join(", ") : ``;
		const description = `${replacement} ${EmojiType[type]}${matchesText} ${inheritedText}`.trim();
		output.push(description);
	}

	return output.join("\n");
}

async function _emojiList(sageMessage: SageMessage, which: BotServerGameType, canSync: boolean, ...types: EmojiType[]): Promise<void> {
	const emoji = getEmoji(sageMessage, which);
	let render = emoji.size > 0;
	if (!render) {
		if (which !== BotServerGameType.Bot && canSync) {
			const prompt = `**No ${getEmojiName(which)} Emoji Found!**\n> Sync with ${getOtherName(which)}?`;
			const booleanResponse = await discordPromptYesNo(sageMessage, prompt, true).catch(errorReturnUndefined);
			if (booleanResponse) {
				emoji.sync(getOtherEmoji(sageMessage, which));
				render = await getWhichEntity(sageMessage, which)?.save() ?? false;
			}
		}
		if (!render) {
			await sageMessage.replyStack.whisper(`Sorry, there was an error getting Emoji.`);
			return;
		}
	}

	const botEmoji = sageMessage.bot.emoji.toArray();
	const filteredEmoji = types.length ? botEmoji.filter(({ type }) => types.includes(type)) : botEmoji;
	const content = `### RPG Sage ${BotServerGameType[which]} Emoji *(${filteredEmoji.length})*`;
	const text = renderEmoji(sageMessage, ...filteredEmoji.map(({ type }) =>  ({ which, type })));

	const payloads = splitMessageOptions({ content:`${content}\n${text}` });
	for (const payload of payloads) {
		await sageMessage.replyStack.send(payload);
	}
}

async function emojiListBot(sageMessage: SageMessage): Promise<void> {
	await _emojiList(sageMessage, BotServerGameType.Bot, sageMessage.actor.sage.isSuperUser);
}

async function emojiListServer(sageMessage: SageMessage): Promise<void> {
	await _emojiList(sageMessage, BotServerGameType.Server, sageMessage.canAdminServer && sageMessage.testServerAdmin());
}

async function emojiListGame(sageMessage: SageMessage): Promise<void> {
	if (sageMessage.game) {
		await _emojiList(sageMessage, BotServerGameType.Game, sageMessage.canAdminGame);
	}else {
		await sageMessage.replyStack.whisper("Game not found.");
	}
}

async function emojiList(sageMessage: SageMessage): Promise<void> {
	if (sageMessage.game) {
		return emojiListGame(sageMessage);
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
		return sageMessage.replyStack.whisper(`Sorry, you aren't allowed to view Bot emoji in this channel.`);
	}

	const types = getEmojiTypes(sageMessage);
	if (!types.length) {
		return sageMessage.replyStack.whisperWikiHelp({ message:`Invalid EmojiType: ${sageMessage.args.getString("type")}.`, page:`Emoji Management` });
	}

	await _emojiList(sageMessage, BotServerGameType.Bot, sageMessage.actor.sage.isSuperUser, ...types);
}

async function emojiGetServer(sageMessage: SageMessage): Promise<void> {
	if ([0, 5].includes(sageMessage.channel?.type!)) {
		return sageMessage.replyStack.whisper(`Sorry, you aren't allowed to view Server emoji in this channel.`);
	}

	const types = getEmojiTypes(sageMessage);
	if (!types.length) {
		return sageMessage.replyStack.whisperWikiHelp({ message:`Invalid EmojiType: ${sageMessage.args.getString("type")}.`, page:`Emoji Management` });
	}

	await _emojiList(sageMessage, BotServerGameType.Server, sageMessage.canAdminServer && sageMessage.testServerAdmin(), ...types);
}

async function emojiGetGame(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.game) {
		return sageMessage.replyStack.whisper("Game not found.");
	}
	if (!sageMessage.canAdminGame && !sageMessage.isPlayer) {
		return sageMessage.replyStack.whisper(`Sorry, you aren't allowed to access this Game.`);
	}
	if ([0, 5].includes(sageMessage.channel?.type!)) {
		return sageMessage.replyStack.whisper(`Sorry, you aren't allowed to view Game emoji in this channel.`);
	}

	const types = getEmojiTypes(sageMessage);
	if (!types.length) {
		return sageMessage.replyStack.whisperWikiHelp({ message:`Invalid EmojiType: ${sageMessage.args.getString("type")}.`, page:`Emoji Management` });
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
		return sageMessage.replyStack.whisper(`Sorry, you aren't allowed to change Server emoji.`);
	}
	if (!sageMessage.testServerAdmin() || !sageMessage.server) {
		return sageMessage.replyStack.whisper(`Sorry, you aren't allowed to change Server emoji in this channel.`);
	}

	const emojiAndTypes = getEmojiAndTypes(sageMessage);
	if (!emojiAndTypes.length) {
		return sageMessage.replyStack.whisperWikiHelp({ message:`Invalid Input.`, page:`Emoji Management` });
	}

	let changes = 0;
	for (const emojiAndType of emojiAndTypes) {
		const matches = sageMessage.bot.emoji.findEmoji(emojiAndType.type)?.matches ?? [];
		const set = sageMessage.server.emoji.set({ ...emojiAndType, matches });
		if (set) changes++;
	}

	const saved = changes ? await sageMessage.server.save() : false;
	const updated = saved ? changes : 0;
	const saveError = changes && !saved ? `\nSorry, we were unable to save your changes!` : ``;

	const pairs = emojiAndTypes.map(({ type }) => ({ which:BotServerGameType.Server, type }));
	const label = `### RPG Sage Server Emoji Updated (${updated}/${pairs.length})`;
	const rendered = renderEmoji(sageMessage, ...pairs);
	const content = `${label}${saveError}\n${rendered}`;
	await sageMessage.replyStack.reply({ content });
}

async function emojiSetGame(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.game) {
		return sageMessage.replyStack.whisper("Game not found.");
	}
	if (!sageMessage.canAdminGame) {
		return sageMessage.replyStack.whisper(`Sorry, you aren't allowed to change Game emoji.`);
	}

	const emojiAndTypes = getEmojiAndTypes(sageMessage);
	if (!emojiAndTypes.length) {
		return sageMessage.replyStack.whisperWikiHelp({ message:`Invalid Input.`, page:`Emoji Management` });
	}

	let changes = 0;
	for (const emojiAndType of emojiAndTypes) {
		const matches = sageMessage.bot.emoji.findEmoji(emojiAndType.type)?.matches ?? [];
		const set = sageMessage.game.emoji.set({ ...emojiAndType, matches });
		if (set) changes++;
	}

	const saved = changes ? await sageMessage.game.save() : false;
	const updated = saved ? changes : 0;
	const saveError = changes && !saved ? `\nSorry, we were unable to save your changes!` : ``;

	const pairs = emojiAndTypes.map(({ type }) => ({ which:BotServerGameType.Game, type }));
	const label = `### RPG Sage Game Emoji Updated (${updated}/${pairs.length})`;
	const rendered = renderEmoji(sageMessage, ...pairs);
	const content = `${label}${saveError}\n${rendered}`;
	await sageMessage.replyStack.reply({ content });
}

async function emojiSet(sageMessage: SageMessage): Promise<void> {
	return sageMessage.game ? emojiSetGame(sageMessage) : emojiSetServer(sageMessage);
}

//#endregion

//#region sync

async function emojiSyncServer(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminServer) {
		return sageMessage.replyStack.whisper(`Sorry, you aren't allowed to change Server emoji.`);
	}
	if (!sageMessage.testServerAdmin()) {
		return sageMessage.replyStack.whisper(`Sorry, you aren't allowed to change Server emoji in this channel.`);
	}

	const { server } = sageMessage;
	if (!server) {
		return sageMessage.replyStack.whisper(`Sorry, you aren't allowed to change Server emoji in this channel.`);
	}
	const booleanResponse = await discordPromptYesNo(sageMessage, "> Sync emoji with Sage?", true);
	if (booleanResponse) {
		server.emoji.sync(sageMessage.bot.emoji);
		const saved = await server.save();
		if (!saved) {
			return sageMessage.replyStack.whisper(`Sorry, we were unable to sync your emoji!`);
		} else {
			return emojiListServer(sageMessage);
		}
	}
}

async function emojiSyncGame(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.game) {
		return sageMessage.replyStack.whisper("Game not found.");
	}
	if (!sageMessage.canAdminGame) {
		return sageMessage.replyStack.whisper(`Sorry, you aren't allowed to change Game emoji.`);
	}

	const { game } = sageMessage;

	const booleanResponse = await discordPromptYesNo(sageMessage, "> Sync emoji with Server?", true);
	if (booleanResponse) {
		game.emoji.sync(game.server.emoji);
		const saved = await game.save();
		if (!saved) {
			return sageMessage.replyStack.whisper(`Sorry, we were unable to sync your emoji!`);
		} else {
			return emojiListGame(sageMessage);
		}
	}
}

async function emojiSync(sageMessage: SageMessage): Promise<void> {
	return sageMessage.game ? emojiSyncGame(sageMessage) : emojiSyncServer(sageMessage);
}

//#endregion

//#region unset

async function emojiUnsetServer(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminServer) {
		return sageMessage.replyStack.whisper(`Sorry, you aren't allowed to change Server emoji.`);
	}
	if (!sageMessage.testServerAdmin()) {
		return sageMessage.replyStack.whisper(`Sorry, you aren't allowed to change Server emoji in this channel.`);
	}

	const types = getEmojiTypes(sageMessage);
	if (!types.length) {
		return sageMessage.replyStack.whisperWikiHelp({ message:`Invalid EmojiType: ${sageMessage.args.getString("type")}.`, page:`Emoji Management` });
	}

	let changes = 0;
	for (const type of types) {
		const unset = sageMessage.server?.emoji.unset(type);
		if (unset) changes++;
	}

	const saved = changes ? await sageMessage.server?.save() ?? false : false;
	const updated = saved ? changes : 0;
	const saveError = changes && !saved ? `\nSorry, we were unable to save your changes!` : ``;

	const label = `### RPG Sage Server Emoji Unset (${updated}/${types.length})`;
	const rendered = renderEmoji(sageMessage, ...types.map(type => ({ which:BotServerGameType.Server, type })));
	const content = `${label}${saveError}\n${rendered}`;
	await sageMessage.replyStack.reply({ content });
}

async function emojiUnsetGame(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.game) {
		return sageMessage.replyStack.whisper("Game not found.");
	}
	if (!sageMessage.canAdminGame) {
		return sageMessage.replyStack.whisper(`Sorry, you aren't allowed to change Game emoji.`);
	}

	const types = getEmojiTypes(sageMessage);
	if (!types.length) {
		return sageMessage.replyStack.whisperWikiHelp({ message:`Invalid EmojiType: ${sageMessage.args.getString("type")}.`, page:`Emoji Management` });
	}

	let changes = 0;
	for (const type of types) {
		const unset = sageMessage.game.emoji.unset(type);
		if (unset) changes++;
	}

	const saved = changes ? await sageMessage.game.save() : false;
	const updated = saved ? changes : 0;
	const saveError = changes && !saved ? `\nSorry, we were unable to save your changes!` : ``;

	const label = `### RPG Sage Game Emoji Unset (${updated}/${types.length})`;
	const rendered = renderEmoji(sageMessage, ...types.map(type => ({ which:BotServerGameType.Game, type })));
	const content = `${label}${saveError}\n${rendered}`;
	await sageMessage.replyStack.reply({ content });
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
