import { partition } from "@rsc-utils/array-utils";
import { errorReturnNull } from "@rsc-utils/console-utils";
import { isDefined, type Optional } from "@rsc-utils/type-utils";
import { discordPromptYesNo } from "../../../discord/prompts";
import type { Colors } from "../../model/Colors";
import type { Game } from "../../model/Game";
import { ColorType } from "../../model/HasColorsCore";
import type { SageMessage } from "../../model/SageMessage";
import type { Server } from "../../model/Server";
import { BotServerGameType, registerAdminCommand } from "../cmd";
import { registerAdminCommandHelp } from "../help";
import { embedColor } from "./color/embedColor";

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
function getWhichEntity(sageMessage: SageMessage, which: BotServerGameType): Server | Game {
	return which === BotServerGameType.Server ? sageMessage.server : sageMessage.game!;
}
async function _colorList(sageMessage: SageMessage, which: BotServerGameType): Promise<void> {
	const colors = getColors(sageMessage, which);
	let render = colors.size > 0;
	if (!render) {
		if (which !== BotServerGameType.Bot) {
			const prompt = `**No ${getColorName(which)} Colors Found!**\n> Sync with ${getOtherName(which)}?`;
			const booleanResponse = await discordPromptYesNo(sageMessage, prompt).catch(errorReturnNull);
			if (booleanResponse) {
				colors.sync(getOtherColors(sageMessage, which));
				render = await getWhichEntity(sageMessage, which).save();
			}
		}
		if (!render) {
			return sageMessage.reactError();
		}
	}

	if (render) {
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
		const embedGroups = partition(embeds, (_, index) => Math.floor(index / 10));
		for (const embedGroup of embedGroups) {
			await sageMessage.message.channel.send({ embeds:embedGroup });
		}
	}

	return Promise.resolve();
}

async function colorListBot(sageMessage: SageMessage): Promise<void> {
	return sageMessage.isSuperUser ? _colorList(sageMessage, BotServerGameType.Bot) : sageMessage.reactBlock();
}

async function colorListServer(sageMessage: SageMessage): Promise<void> {
	return sageMessage.canAdminServer && sageMessage.testServerAdmin() ? _colorList(sageMessage, BotServerGameType.Server) : sageMessage.reactBlock();
}

async function colorListGame(sageMessage: SageMessage): Promise<void> {
	return sageMessage.canAdminGame ? _colorList(sageMessage, BotServerGameType.Game) : sageMessage.reactBlock();
}

async function colorList(sageMessage: SageMessage): Promise<void> {
	return sageMessage.game ? colorListGame(sageMessage) : sageMessage.server ? colorListServer(sageMessage) : colorListBot(sageMessage);
}

//#endregion

//#region get

async function _colorGet(sageMessage: SageMessage, ...colors: Optional<Colors>[]): Promise<void> {
	if (!sageMessage.isSuperUser) {
		return sageMessage.reactBlock();
	}

	colors = colors.filter(isDefined);

	const colorType = sageMessage.args.removeAndReturnEnum<ColorType>(ColorType)!;
	let inherited = false;
	let color = colors.shift()!.get(colorType);
	while (!color && colors.length) {
		inherited = true;
		color = colors.shift()!.get(colorType);
	}
	if (!color) {
		return sageMessage.reactFailure();
	}

	const inheritedText = inherited ? ` (unset, inherited)` : ``;
	await sageMessage.message.channel.send({ embeds:[embedColor(color, ColorType[colorType], inheritedText)] });
	return Promise.resolve();
}

async function colorGetBot(sageMessage: SageMessage): Promise<void> {
	return sageMessage.isSuperUser ? _colorGet(sageMessage, sageMessage.bot.colors) : sageMessage.reactBlock();
}

async function colorGetServer(sageMessage: SageMessage): Promise<void> {
	return sageMessage.canAdminServer && sageMessage.testServerAdmin() ? _colorGet(sageMessage, sageMessage.server?.colors, sageMessage.bot.colors) : sageMessage.reactBlock();
}

async function colorGetGame(sageMessage: SageMessage): Promise<void> {
	return sageMessage.canAdminGame ? _colorGet(sageMessage, sageMessage.game?.colors, sageMessage.server?.colors, sageMessage.bot.colors) : sageMessage.reactBlock();
}

async function colorGet(sageMessage: SageMessage): Promise<void> {
	return sageMessage.game ? colorGetGame(sageMessage) : sageMessage.server ? colorGetServer(sageMessage) : colorGetBot(sageMessage);
}

//#endregion

//#region set

async function colorSetServer(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminServer) {
		return sageMessage.reactBlock();
	}
	if (!sageMessage.testServerAdmin()) {
		return sageMessage.reactBlock();
	}

	const colorAndType = sageMessage.args.removeAndReturnColorAndType();
	if (!colorAndType) {
		return sageMessage.reactFailure();
	}

	const set = sageMessage.server.colors.set(colorAndType);
	if (!set) {
		return sageMessage.reactFailure();
	}

	const saved = await sageMessage.server.save();
	sageMessage.reactSuccessOrFailure(saved);
	if (saved) {
		sageMessage.message.channel.send({ embeds:[embedColor(colorAndType.color, ColorType[colorAndType.type])] });
	}
	return Promise.resolve();
}

async function colorSetGame(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminGame) {
		return sageMessage.reactBlock();
	}

	const game = sageMessage.game!;

	const colorAndType = sageMessage.args.removeAndReturnColorAndType();
	if (!colorAndType) {
		return sageMessage.reactFailure();
	}

	const set = game.colors.set(colorAndType);
	if (!set) {
		return sageMessage.reactFailure();
	}

	const saved = await game.save();
	sageMessage.reactSuccessOrFailure(saved);
	if (saved) {
		sageMessage.message.channel.send({ embeds:[embedColor(colorAndType.color, ColorType[colorAndType.type])] });
	}

	return Promise.resolve();
}

async function colorSet(sageMessage: SageMessage): Promise<void> {
	return sageMessage.game ? colorSetGame(sageMessage) : colorSetServer(sageMessage);
}

//#endregion

//#region sync

async function colorSyncServer(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminServer) {
		return sageMessage.reactBlock();
	}
	if (!sageMessage.testServerAdmin()) {
		return sageMessage.reactBlock();
	}

	const server = sageMessage.server;

	const booleanResponse = await discordPromptYesNo(sageMessage, "> Sync colors with Sage?");
	if (booleanResponse) {
		server.colors.sync(sageMessage.bot.colors);
		const saved = await server.save();
		if (!saved) {
			sageMessage.reactError();
		} else {
			colorListServer(sageMessage);
		}
	}
	return Promise.resolve();
}

async function colorSyncGame(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminGame) {
		return sageMessage.reactBlock();
	}

	const game = sageMessage.game!;

	const booleanResponse = await discordPromptYesNo(sageMessage, "> Sync colors with Server?");
	if (booleanResponse) {
		game.colors.sync(game.server.colors);
		const saved = await game.save();
		if (!saved) {
			sageMessage.reactError();
		} else {
			colorListGame(sageMessage);
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
		return sageMessage.reactBlock();
	}
	if (!sageMessage.testServerAdmin()) {
		return sageMessage.reactBlock();
	}

	const colorType = sageMessage.args.removeAndReturnEnum<ColorType>(ColorType);
	const unset = sageMessage.server.colors.unset(colorType);
	if (!unset) {
		return sageMessage.reactFailure();
	}

	const saved = await sageMessage.server.save();
	return sageMessage.reactSuccessOrFailure(saved);
}

async function colorUnsetGame(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminGame) {
		return sageMessage.reactBlock();
	}

	const game = sageMessage.game!;

	const colorType = sageMessage.args.removeAndReturnEnum<ColorType>(ColorType);
	const unset = game.colors.unset(colorType);
	if (!unset) {
		return sageMessage.reactFailure();
	}

	const saved = await game.save();
	sageMessage.reactSuccessOrFailure(saved);

	return Promise.resolve();
}

async function colorUnset(sageMessage: SageMessage): Promise<void> {
	return sageMessage.game ? colorUnsetGame(sageMessage) : colorUnsetServer(sageMessage);
}

//#endregion

export function registerColor(): void {
	registerAdminCommand(colorListBot, "color-list-bot");
	registerAdminCommand(colorListServer, "color-list-server");
	registerAdminCommand(colorListGame, "color-list-game");
	registerAdminCommand(colorList, "color-list");

	registerAdminCommand(colorGetBot, "color-get-bot");
	registerAdminCommand(colorGetServer, "color-get-server");
	registerAdminCommand(colorGetGame, "color-get-game");
	registerAdminCommand(colorGet, "color-get");

	registerAdminCommand(colorSetServer, "color-set-server");
	registerAdminCommand(colorSetGame, "color-set-game");
	registerAdminCommand(colorSet, "color-set");

	registerAdminCommand(colorSyncServer, "color-sync-server");
	registerAdminCommand(colorSyncGame, "color-sync-game");
	registerAdminCommand(colorSync, "color-sync");

	registerAdminCommand(colorUnsetServer, "color-unset-server");
	registerAdminCommand(colorUnsetGame, "color-unset-game");
	registerAdminCommand(colorUnset, "color-unset");

	registerAdminCommandHelp("Admin", "SuperUser", "Color", "color get bot {ColorType}");
	registerAdminCommandHelp("Admin", "SuperUser", "Color", "color list bot");

	registerAdminCommandHelp("Admin", "Color", "color get {ColorType}");
	registerAdminCommandHelp("Admin", "Color", "color get {server|game} {ColorType}");

	registerAdminCommandHelp("Admin", "Color", "color list");
	registerAdminCommandHelp("Admin", "Color", "color list {server|game}");

	registerAdminCommandHelp("Admin", "Color", "color set {ColorType} {hexColorValue}");
	registerAdminCommandHelp("Admin", "Color", "color set {server|game} {ColorType} {hexColorValue}");

	registerAdminCommandHelp("Admin", "Color", "color sync");
	registerAdminCommandHelp("Admin", "Color", "color sync {server|game}");

	registerAdminCommandHelp("Admin", "Color", "color unset {ColorType}");
	registerAdminCommandHelp("Admin", "Color", "color unset {server|game} {ColorType}");
}
