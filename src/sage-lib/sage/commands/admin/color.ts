import { partition } from "@rsc-utils/array-utils";
import { errorReturnNull } from "@rsc-utils/core-utils";
import { isDefined } from "@rsc-utils/core-utils";
import { registerListeners } from "../../../discord/handlers/registerListeners.js";
import { discordPromptYesNo } from "../../../discord/prompts.js";
import type { Colors, TColorAndType } from "../../model/Colors.js";
import type { Game } from "../../model/Game.js";
import { ColorType } from "../../model/HasColorsCore.js";
import type { SageCommand } from "../../model/SageCommand.js";
import type { SageMessage } from "../../model/SageMessage.js";
import type { Server } from "../../model/Server.js";
import { BotServerGameType } from "../helpers/BotServerGameType.js";
import { embedColor } from "../helpers/embedColor.js";

//#region list

function getColors(sageMessage: SageMessage, which: BotServerGameType): Colors {
	if (which === BotServerGameType.Game && sageMessage.game) {
		return sageMessage.game.colors;
	}
	return which !== BotServerGameType.Bot ? sageMessage.server.colors : sageMessage.bot.colors;
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

async function _colorList(sageMessage: SageMessage, which: BotServerGameType, canSync: boolean): Promise<void> {
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
			return sageMessage.whisper(`Sorry, there was an error getting Colors.`);
		}
	}

	let colorIndex = 0;
	const botColors = sageMessage.bot.colors.toArray();
	const colorCount = botColors.length;
	const embeds = botColors.map(botColor => {
		let color = colors.get(botColor.type);
		let inherited = false;
		if (!color && which === BotServerGameType.Game) {
			inherited = true;
			color = getColors(sageMessage, BotServerGameType.Server).get(botColor.type);
		}
		if (!color) {
			inherited = true;
			color = sageMessage.bot.colors.get(botColor.type)!;
		}
		const inheritedText = inherited ? `(unset, inherited)` : ``;
		const countText = `(${++colorIndex} of ${colorCount})`;
		return embedColor(color, ColorType[botColor.type], inheritedText, countText);
	});

	const contents = [`RPG Sage ${BotServerGameType[which]} Colors *(${colorCount})*`];
	const embedGroups = partition(embeds, (_, index) => Math.floor(index / 10));
	for (const embedGroup of embedGroups) {
		const content = contents.shift();
		await sageMessage.message.channel.send({ content, embeds:embedGroup });
	}

	return Promise.resolve();
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
		await sageMessage.whisper("Game not found.");
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

type WhichColors = { bot?:Colors; server?:Colors; game?:Colors; };

async function _colorGet(sageMessage: SageMessage, colors: WhichColors): Promise<void> {
	const type = sageMessage.args.getEnum(ColorType, "type")!;
	if (!isDefined(type)) {
		return sageMessage.whisperWikiHelp({ message:`Invalid ColorType: ${sageMessage.args.getString("type")}.`, page:`Color Management` });
	}

	let inherited = false;
	const colorArray = [colors.game, colors.server, colors.bot].filter(isDefined);
	let color = colorArray.shift()!.get(type);
	while (!color && colorArray.length) {
		inherited = true;
		color = colorArray.shift()!.get(type);
	}
	if (!color) {
		return sageMessage.whisperWikiHelp({ message:`Invalid ColorType: ${sageMessage.args.getString("type")}.`, page:`Color Management` });
	}

	const inheritedText = inherited ? ` (unset, inherited)` : ``;
	await sageMessage.message.channel.send({ embeds:[embedColor(color, ColorType[type], inheritedText)] });
	return Promise.resolve();
}

async function colorGetBot(sageMessage: SageMessage): Promise<void> {
	if ([0, 5].includes(sageMessage.channel?.type!)) {
		return sageMessage.whisper(`Sorry, you aren't allowed to view Bot colors in this channel.`);
	}
	return _colorGet(sageMessage, { bot:sageMessage.bot.colors });
}

async function colorGetServer(sageMessage: SageMessage): Promise<void> {
	if ([0, 5].includes(sageMessage.channel?.type!)) {
		return sageMessage.whisper(`Sorry, you aren't allowed to view Server colors in this channel.`);
	}
	return _colorGet(sageMessage, { server:sageMessage.server?.colors, bot:sageMessage.bot.colors });
}

async function colorGetGame(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.game) {
		return sageMessage.whisper("Game not found.");
	}
	if (!sageMessage.canAdminGame && !sageMessage.isPlayer) {
		return sageMessage.whisper(`Sorry, you aren't allowed to access this Game.`);
	}
	if ([0, 5].includes(sageMessage.channel?.type!)) {
		return sageMessage.whisper(`Sorry, you aren't allowed to view Game colors in this channel.`);
	}
	return _colorGet(sageMessage, { game:sageMessage.game?.colors, server:sageMessage.server?.colors, bot:sageMessage.bot.colors });
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

function getColorAndType(sageCommand: SageCommand): TColorAndType | undefined {
	const color = sageCommand.args.getColor("color");
	const type = sageCommand.args.getEnum(ColorType, "type");
	if (color && isDefined(type)) {
		return { color, type };
	}

	if (sageCommand.isSageMessage()) {
		const colorAndType = sageCommand.args.removeAndReturnColorAndType();
		if (colorAndType) {
			if (color) {
				return { color, type:colorAndType.type };
			}
			if (isDefined(type)) {
				return { color:colorAndType.color, type };
			}
			return colorAndType;
		}
	}

	return undefined;
}

async function colorSetServer(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminServer) {
		return sageMessage.whisper(`Sorry, you aren't allowed to change Server colors.`);
	}
	if (!sageMessage.testServerAdmin()) {
		return sageMessage.whisper(`Sorry, you aren't allowed to change Server colors in this channel.`);
	}

	const colorAndType = getColorAndType(sageMessage);
	if (!colorAndType) {
		return sageMessage.whisperWikiHelp({ message:`Invalid Input.`, page:`Color Management` });
	}

	const set = sageMessage.server.colors.set(colorAndType);
	if (!set) {
		return sageMessage.whisper(`Sorry, we were unable set your color!`);
	}

	const saved = await sageMessage.server.save();
	if (!saved) {
		return sageMessage.whisper(`Sorry, we were unable set your color!`);
	}

	return sageMessage.reply({ embeds:[embedColor(colorAndType.color, ColorType[colorAndType.type])] });
}

async function colorSetGame(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.game) {
		return sageMessage.whisper("Game not found.");
	}
	if (!sageMessage.canAdminGame) {
		return sageMessage.whisper(`Sorry, you aren't allowed to change Game colors.`);
	}

	const colorAndType = getColorAndType(sageMessage);
	if (!colorAndType) {
		return sageMessage.whisperWikiHelp({ message:`Invalid Input.`, page:`Color Management` });
	}

	const set = sageMessage.game.colors.set(colorAndType);
	if (!set) {
		return sageMessage.whisper(`Sorry, we were unable set your color!`);
	}

	const saved = await sageMessage.game.save();
	if (!saved) {
		return sageMessage.whisper(`Sorry, we were unable set your color!`);
	}

	return sageMessage.reply({ embeds:[embedColor(colorAndType.color, ColorType[colorAndType.type])] });
}

async function colorSet(sageMessage: SageMessage): Promise<void> {
	return sageMessage.game ? colorSetGame(sageMessage) : colorSetServer(sageMessage);
}

//#endregion

//#region sync

async function colorSyncServer(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminServer) {
		return sageMessage.whisper(`Sorry, you aren't allowed to change Server colors.`);
	}
	if (!sageMessage.testServerAdmin()) {
		return sageMessage.whisper(`Sorry, you aren't allowed to change Server colors in this channel.`);
	}

	const server = sageMessage.server;

	const booleanResponse = await discordPromptYesNo(sageMessage, "> Sync colors with Sage?");
	if (booleanResponse) {
		server.colors.sync(sageMessage.bot.colors);
		const saved = await server.save();
		if (!saved) {
			return sageMessage.whisper(`Sorry, we were unable sync your colors!`);
		} else {
			return colorListServer(sageMessage);
		}
	}
	return Promise.resolve();
}

async function colorSyncGame(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminGame) {
		return sageMessage.whisper(`Sorry, you aren't allowed to change Game colors.`);
	}

	const game = sageMessage.game!;

	const booleanResponse = await discordPromptYesNo(sageMessage, "> Sync colors with Server?");
	if (booleanResponse) {
		game.colors.sync(game.server.colors);
		const saved = await game.save();
		if (!saved) {
			return sageMessage.whisper(`Sorry, we were unable sync your colors!`);
		} else {
			return colorListGame(sageMessage);
		}
	}

	return Promise.resolve();
}

async function colorSync(sageMessage: SageMessage): Promise<void> {
	return sageMessage.game ? colorSyncGame(sageMessage) : colorSyncServer(sageMessage);
}

//#endregion

//#region unset

async function colorUnsetServer(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminServer) {
		return sageMessage.whisper(`Sorry, you aren't allowed to change Server colors.`);
	}
	if (!sageMessage.testServerAdmin()) {
		return sageMessage.whisper(`Sorry, you aren't allowed to change Server colors in this channel.`);
	}

	const type = sageMessage.args.getEnum(ColorType, "type");
	if (!isDefined(type)) {
		return sageMessage.whisperWikiHelp({ message:`Invalid ColorType: ${sageMessage.args.getString("type")}.`, page:`Color Management` });
	}

	const unset = sageMessage.server.colors.unset(type);
	if (!unset) {
		return sageMessage.whisper(`Nothing to unset!`);
	}

	const saved = await sageMessage.server.save();
	if (!saved) {
		return sageMessage.whisper(`Sorry, we were unable unset your color!`);
	}

	/** @todo return the unset/default color */
	return sageMessage.reactSuccess();
}

async function colorUnsetGame(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminGame) {
		return sageMessage.whisper(`Sorry, you aren't allowed to change Game colors.`);
	}

	const game = sageMessage.game!;

	const type = sageMessage.args.getEnum(ColorType, "type");
	if (!isDefined(type)) {
		return sageMessage.whisperWikiHelp({ message:`Invalid ColorType: ${sageMessage.args.getString("type")}.`, page:`Color Management` });
	}

	const unset = game.colors.unset(type);
	if (!unset) {
		return sageMessage.whisper(`Nothing to unset!`);
	}

	const saved = await game.save();
	if (!saved) {
		return sageMessage.whisper(`Sorry, we were unable unset your color!`);
	}

	/** @todo return the unset/default color */
	return sageMessage.reactSuccess();
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
