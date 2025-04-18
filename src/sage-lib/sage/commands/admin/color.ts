import { Color, errorReturnNull, getEnumValues, isDefined, parseEnum, partition } from "@rsc-utils/core-utils";
import { EmbedBuilder } from "@rsc-utils/discord-utils";
import { registerListeners } from "../../../discord/handlers/registerListeners.js";
import { discordPromptYesNo } from "../../../discord/prompts.js";
import type { Colors, TColorAndType } from "../../model/Colors.js";
import type { Game } from "../../model/Game.js";
import { ColorType } from "../../model/HasColorsCore.js";
import type { SageCommand } from "../../model/SageCommand.js";
import type { SageMessage } from "../../model/SageMessage.js";
import type { Server } from "../../model/Server.js";
import { BotServerGameType } from "../helpers/BotServerGameType.js";

//#region args

function getColorTypes(sageMessage: SageMessage): ColorType[] {

	// get emoji by key, where key is keyof EmojiType
	const types = sageMessage.args.toArray()
		.map(arg => parseEnum<ColorType>(ColorType, arg))
		.filter(isDefined);

	if (!types.length) {
		const type = sageMessage.args.getEnum(ColorType, "type");
		if (isDefined(type)) types.push(type);
	}

	return types;
}

function getColorAndTypes(sageCommand: SageCommand): TColorAndType[] {
	const results: TColorAndType[] = [];

	// get color by key/value pair, where key is keyof ColorType
	const types = getEnumValues<ColorType>(ColorType);
	types.forEach(type => {
		const color = sageCommand.args.getColor(ColorType[type]);
		if (color) {
			results.push({ color, type });
		}
	});

	// If none found, fall back to the old way of type="keyof ColorType" and color="color"
	if (!results.length) {
		const color = sageCommand.args.getColor("color");
		const type = sageCommand.args.getEnum(ColorType, "type");
		if (color && isDefined(type)) {
			results.push({ color, type });
		}
	}

	return results;
}

//#endregion

//#region list

function getColors(sageCommand: SageCommand, which: BotServerGameType): Colors {
	if (which === BotServerGameType.Game && sageCommand.game) {
		return sageCommand.game.colors;
	}
	if (which !== BotServerGameType.Bot && sageCommand.server) {
		return sageCommand.server.colors;
	}
	return sageCommand.bot.colors;
}

function getColorName(which: BotServerGameType): string {
	return which === BotServerGameType.Server ? "Server" : "Game";
}

function getOtherName(which: BotServerGameType): string {
	return which === BotServerGameType.Server ? "Sage" : "Server";
}

function getOtherColors(sageMessage: SageMessage, which: BotServerGameType): Colors {
	return which === BotServerGameType.Server ? sageMessage.bot.colors : sageMessage.server.colors;
}

function getWhichEntity(sageMessage: SageMessage, which: BotServerGameType): Server | Game | undefined {
	return which === BotServerGameType.Server ? sageMessage.server : sageMessage.game;
}

type RenderPair = { which:BotServerGameType; type:ColorType; };

function renderColors(sageCommand: SageCommand, ...pairs: RenderPair[]): EmbedBuilder[] {
	const embeds: EmbedBuilder[] = [];

	for (const { which, type } of pairs) {
		const botColor = sageCommand.bot.colors.findColor(type);
		if (!botColor) {
			embeds.push(new EmbedBuilder({ description:`Invalid ColorType: ${type}` }));
			continue;
		}

		let color = getColors(sageCommand, which).findColor(type)?.hex;
		let inherited = false;
		if (!color && which === BotServerGameType.Game) {
			inherited = true;
			color = getColors(sageCommand, BotServerGameType.Server).findColor(type)?.hex;
		}
		if (!color) {
			inherited = true;
			color = botColor.hex;
		}

		const inheritedText = inherited ? `*(unset, inherited)*` : ``;
		const hexColor = Color.from(color).hex;
		const description = `${hexColor.toUpperCase()} ${ColorType[type]} ${inheritedText}`.trim();
		embeds.push(new EmbedBuilder({ description }).setColor(hexColor));
	}

	return embeds;
}

async function _colorList(sageMessage: SageMessage, which: BotServerGameType, canSync: boolean, ...types: ColorType[]): Promise<void> {
	const colors = getColors(sageMessage, which);
	let render = colors.size > 0;
	if (!render) {
		if (which !== BotServerGameType.Bot && canSync) {
			const prompt = `**No ${getColorName(which)} Colors Found!**\n> Sync with ${getOtherName(which)}?`;
			const booleanResponse = await discordPromptYesNo(sageMessage, prompt).catch(errorReturnNull);
			if (booleanResponse) {
				colors.sync(getOtherColors(sageMessage, which));
				render = await getWhichEntity(sageMessage, which)?.save() ?? false;
			}
		}
		if (!render) {
			await sageMessage.replyStack.whisper(`Sorry, there was an error getting Colors.`);
			return;
		}
	}

	const botColors = sageMessage.bot.colors.toArray();
	const filteredColors = types.length ? botColors.filter(({ type }) => types.includes(type)) : botColors;
	const contents = [`### RPG Sage ${BotServerGameType[which]} Colors *(${filteredColors.length})*`];
	const allEmbeds = renderColors(sageMessage, ...filteredColors.map(({ type }) => ({ which, type })));
	const embedGroups = partition(allEmbeds, (_, index) => Math.floor(index / 10));
	for (const embeds of embedGroups) {
		const content = contents.shift();
		await sageMessage.replyStack.send({ content, embeds });
	}
}

async function colorListBot(sageMessage: SageMessage): Promise<void> {
	await _colorList(sageMessage, BotServerGameType.Bot, sageMessage.isSuperUser);
}

async function colorListServer(sageMessage: SageMessage): Promise<void> {
	await _colorList(sageMessage, BotServerGameType.Server, sageMessage.canAdminServer && sageMessage.testServerAdmin());
}

async function colorListGame(sageMessage: SageMessage): Promise<void> {
	if (sageMessage.game) {
		await _colorList(sageMessage, BotServerGameType.Game, sageMessage.canAdminGame);
	}else {
		await sageMessage.replyStack.whisper("Game not found.");
	}
}

async function colorList(sageMessage: SageMessage): Promise<void> {
	if (sageMessage.game) {
		return colorListGame(sageMessage);
	}
	if (sageMessage.server) {
		return colorListServer(sageMessage);
	}
	return colorListBot(sageMessage);
}

//#endregion

//#region get

async function colorGetBot(sageMessage: SageMessage): Promise<void> {
	if ([0, 5].includes(sageMessage.channel?.type!)) {
		return sageMessage.replyStack.whisper(`Sorry, you aren't allowed to view Bot colors in this channel.`);
	}

	const types = getColorTypes(sageMessage);
	if (!types.length) {
		return sageMessage.replyStack.whisperWikiHelp({ message:`Invalid ColorType: ${sageMessage.args.getString("type")}.`, page:`Color Management` });
	}

	await _colorList(sageMessage, BotServerGameType.Bot, sageMessage.isSuperUser, ...types);
}

async function colorGetServer(sageMessage: SageMessage): Promise<void> {
	if ([0, 5].includes(sageMessage.channel?.type!)) {
		return sageMessage.replyStack.whisper(`Sorry, you aren't allowed to view Server colors in this channel.`);
	}

	const types = getColorTypes(sageMessage);
	if (!types.length) {
		return sageMessage.replyStack.whisperWikiHelp({ message:`Invalid ColorType: ${sageMessage.args.getString("type")}.`, page:`Color Management` });
	}

	await _colorList(sageMessage, BotServerGameType.Server, sageMessage.canAdminServer && sageMessage.testServerAdmin(), ...types);
}

async function colorGetGame(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.game) {
		return sageMessage.replyStack.whisper("Game not found.");
	}
	if (!sageMessage.canAdminGame && !sageMessage.isPlayer) {
		return sageMessage.replyStack.whisper(`Sorry, you aren't allowed to access this Game.`);
	}
	if ([0, 5].includes(sageMessage.channel?.type!)) {
		return sageMessage.replyStack.whisper(`Sorry, you aren't allowed to view Game colors in this channel.`);
	}

	const types = getColorTypes(sageMessage);
	if (!types.length) {
		return sageMessage.replyStack.whisperWikiHelp({ message:`Invalid ColorType: ${sageMessage.args.getString("type")}.`, page:`Color Management` });
	}

	await _colorList(sageMessage, BotServerGameType.Game, sageMessage.canAdminGame, ...types);
}

async function colorGet(sageMessage: SageMessage): Promise<void> {
	if (sageMessage.game) {
		return colorGetGame(sageMessage);
	}
	if (sageMessage.server) {
		return colorGetServer(sageMessage);
	}
	return colorGetBot(sageMessage);
}

//#endregion

//#region set

async function colorSetServer(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminServer) {
		return sageMessage.replyStack.whisper(`Sorry, you aren't allowed to change Server colors.`);
	}
	if (!sageMessage.testServerAdmin()) {
		return sageMessage.replyStack.whisper(`Sorry, you aren't allowed to change Server colors in this channel.`);
	}

	const colorAndTypes = getColorAndTypes(sageMessage);
	if (!colorAndTypes.length) {
		return sageMessage.replyStack.whisperWikiHelp({ message:`Invalid Input.`, page:`Color Management` });
	}

	let changes = 0;
	for (const colorAndType of colorAndTypes) {
		const set = sageMessage.server.colors.set(colorAndType);
		if (set) changes++;
	}

	const saved = changes ? await sageMessage.server.save() : false;
	const updated = saved ? changes : 0;
	const saveError = changes && !saved ? `\nSorry, we were unable to save your changes!` : ``;

	const pairs = colorAndTypes.map(({ type }) => ({ which:BotServerGameType.Server, type }));
	const content = `### RPG Sage Server Colors Updated (${updated}/${pairs.length})${saveError}`;
	const embeds = renderColors(sageMessage, ...pairs);
	await sageMessage.replyStack.reply({ content, embeds });
}

async function colorSetGame(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.game) {
		return sageMessage.replyStack.whisper("Game not found.");
	}
	if (!sageMessage.canAdminGame) {
		return sageMessage.replyStack.whisper(`Sorry, you aren't allowed to change Game colors.`);
	}

	const colorAndTypes = getColorAndTypes(sageMessage);
	if (!colorAndTypes.length) {
		return sageMessage.replyStack.whisperWikiHelp({ message:`Invalid Input.`, page:`Color Management` });
	}

	let changes = 0;
	for (const colorAndType of colorAndTypes) {
		const set = sageMessage.game.colors.set(colorAndType);
		if (set) changes++;
	}

	const saved = changes ? await sageMessage.game.save() : false;
	const updated = saved ? changes : 0;
	const saveError = changes && !saved ? `\nSorry, we were unable to save your changes!` : ``;

	const pairs = colorAndTypes.map(({ type }) => ({ which:BotServerGameType.Game, type }));
	const content = `### RPG Sage Game Colors Updated (${updated}/${pairs.length})${saveError}`;
	const embeds = renderColors(sageMessage, ...pairs);
	await sageMessage.replyStack.reply({ content, embeds });
}

async function colorSet(sageMessage: SageMessage): Promise<void> {
	return sageMessage.game ? colorSetGame(sageMessage) : colorSetServer(sageMessage);
}

//#endregion

//#region sync

async function colorSyncServer(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminServer) {
		return sageMessage.replyStack.whisper(`Sorry, you aren't allowed to change Server colors.`);
	}
	if (!sageMessage.testServerAdmin()) {
		return sageMessage.replyStack.whisper(`Sorry, you aren't allowed to change Server colors in this channel.`);
	}

	const { server } = sageMessage;

	const booleanResponse = await discordPromptYesNo(sageMessage, "> Sync colors with Sage?");
	if (booleanResponse) {
		server.colors.sync(sageMessage.bot.colors);
		const saved = await server.save();
		if (!saved) {
			return sageMessage.replyStack.whisper(`Sorry, we were unable to sync your colors!`);
		} else {
			return colorListServer(sageMessage);
		}
	}
}

async function colorSyncGame(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.game) {
		return sageMessage.replyStack.whisper("Game not found.");
	}
	if (!sageMessage.canAdminGame) {
		return sageMessage.replyStack.whisper(`Sorry, you aren't allowed to change Game colors.`);
	}

	const { game } = sageMessage;

	const booleanResponse = await discordPromptYesNo(sageMessage, "> Sync colors with Server?");
	if (booleanResponse) {
		game.colors.sync(game.server.colors);
		const saved = await game.save();
		if (!saved) {
			return sageMessage.replyStack.whisper(`Sorry, we were unable to sync your colors!`);
		} else {
			return colorListGame(sageMessage);
		}
	}
}

async function colorSync(sageMessage: SageMessage): Promise<void> {
	return sageMessage.game ? colorSyncGame(sageMessage) : colorSyncServer(sageMessage);
}

//#endregion

//#region unset

async function colorUnsetServer(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminServer) {
		return sageMessage.replyStack.whisper(`Sorry, you aren't allowed to change Server colors.`);
	}
	if (!sageMessage.testServerAdmin()) {
		return sageMessage.replyStack.whisper(`Sorry, you aren't allowed to change Server colors in this channel.`);
	}

	const types = getColorTypes(sageMessage);
	if (!types.length) {
		return sageMessage.replyStack.whisperWikiHelp({ message:`Invalid Input: ${sageMessage.args.getString("type")}.`, page:`Color Management` });
	}

	let changes = 0;
	for (const type of types) {
		const unset = sageMessage.server.colors.unset(type);
		if (unset) changes++;
	}

	const saved = changes ? await sageMessage.server.save() : false;
	const updated = saved ? changes : 0;
	const saveError = changes && !saved ? `\nSorry, we were unable to save your changes!` : ``;

	const content = `### RPG Sage Server Colors Unset (${updated}/${types.length})${saveError}`;
	const embeds = renderColors(sageMessage, ...types.map(type => ({ which:BotServerGameType.Server, type })));
	await sageMessage.replyStack.reply({ content, embeds });
}

async function colorUnsetGame(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.game) {
		return sageMessage.replyStack.whisper("Game not found.");
	}
	if (!sageMessage.canAdminGame) {
		return sageMessage.replyStack.whisper(`Sorry, you aren't allowed to change Game colors.`);
	}

	const types = getColorTypes(sageMessage);
	if (!types.length) {
		return sageMessage.replyStack.whisperWikiHelp({ message:`Invalid Input: ${sageMessage.args.getString("type")}.`, page:`Color Management` });
	}

	let changes = 0;
	for (const type of types) {
		const unset = sageMessage.game.colors.unset(type);
		if (unset) changes++;
	}

	const saved = changes ? await sageMessage.game.save() : false;
	const updated = saved ? changes : 0;
	const saveError = changes && !saved ? `\nSorry, we were unable to save your changes!` : ``;

	const content = `### RPG Sage Game Colors Unset (${updated}/${types.length})${saveError}`;
	const embeds = renderColors(sageMessage, ...types.map(type => ({ which:BotServerGameType.Game, type })));
	await sageMessage.replyStack.reply({ content, embeds });
}

async function colorUnset(sageMessage: SageMessage): Promise<void> {
	return sageMessage.game ? colorUnsetGame(sageMessage) : colorUnsetServer(sageMessage);
}

//#endregion

export function registerColor(): void {
	registerListeners({ commands:["color|list|bot"], message:colorListBot });
	registerListeners({ commands:["color|list|server"], message:colorListServer });
	registerListeners({ commands:["color|list|game"], message:colorListGame });
	registerListeners({ commands:["color|list"], message:colorList });

	registerListeners({ commands:["color|get|bot"], message:colorGetBot });
	registerListeners({ commands:["color|get|server"], message:colorGetServer });
	registerListeners({ commands:["color|get|game"], message:colorGetGame });
	registerListeners({ commands:["color|get"], message:colorGet });

	registerListeners({ commands:["color|set|server"], message:colorSetServer });
	registerListeners({ commands:["color|set|game"], message:colorSetGame });
	registerListeners({ commands:["color|set"], message:colorSet });

	registerListeners({ commands:["color|sync|server"], message:colorSyncServer });
	registerListeners({ commands:["color|sync|game"], message:colorSyncGame });
	registerListeners({ commands:["color|sync"], message:colorSync });

	registerListeners({ commands:["color|unset|server"], message:colorUnsetServer });
	registerListeners({ commands:["color|unset|game"], message:colorUnsetGame });
	registerListeners({ commands:["color|unset"], message:colorUnset });
}
