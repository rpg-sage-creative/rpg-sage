import { partition } from "@rsc-utils/array-utils";
import { errorReturnNull } from "@rsc-utils/console-utils";
import { isDefined, type Optional } from "@rsc-utils/type-utils";
import { discordPromptYesNo } from "../../../discord/prompts.js";
import type { Colors, TColorAndType } from "../../model/Colors.js";
import type { Game } from "../../model/Game.js";
import { ColorType } from "../../model/HasColorsCore.js";
import type { SageCommand } from "../../model/SageCommand.js";
import type { SageMessage } from "../../model/SageMessage.js";
import type { Server } from "../../model/Server.js";
import { registerAdminCommand } from "../cmd.js";
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

	const embedGroups = partition(embeds, (_, index) => Math.floor(index / 10));
	for (const embedGroup of embedGroups) {
		await sageMessage.message.channel.send({ embeds:embedGroup });
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
	await _colorList(sageMessage, BotServerGameType.Game, sageMessage.canAdminGame);
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

async function _colorGet(sageMessage: SageMessage, ...colors: Optional<Colors>[]): Promise<void> {
	colors = colors.filter(isDefined);

	const colorType = sageMessage.args.getEnum(ColorType, "type")!;
	let inherited = false;
	let color = colors.shift()!.get(colorType);
	while (!color && colors.length) {
		inherited = true;
		color = colors.shift()!.get(colorType);
	}
	if (!color) {
		return sageMessage.whisper(`Sorry, you couldn't find a color type named: ${colorType}`);
	}

	const inheritedText = inherited ? ` (unset, inherited)` : ``;
	await sageMessage.message.channel.send({ embeds:[embedColor(color, ColorType[colorType], inheritedText)] });
	return Promise.resolve();
}

async function colorGetBot(sageMessage: SageMessage): Promise<void> {
	if ([0, 5].includes(sageMessage.channel?.type!)) {
		return sageMessage.whisper(`Sorry, you aren't allowed to view Bot colors in this channel.`);
	}
	return _colorGet(sageMessage, sageMessage.bot.colors);
}

async function colorGetServer(sageMessage: SageMessage): Promise<void> {
	if ([0, 5].includes(sageMessage.channel?.type!)) {
		return sageMessage.whisper(`Sorry, you aren't allowed to view Server colors in this channel.`);
	}
	return _colorGet(sageMessage, sageMessage.server?.colors, sageMessage.bot.colors);
}

async function colorGetGame(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminGame && !sageMessage.isPlayer) {
		return sageMessage.whisper(`Sorry, you aren't allowed to access this Game.`);
	}
	if ([0, 5].includes(sageMessage.channel?.type!)) {
		return sageMessage.whisper(`Sorry, you aren't allowed to view Game colors in this channel.`);
	}
	return _colorGet(sageMessage, sageMessage.game?.colors, sageMessage.server?.colors, sageMessage.bot.colors);
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
		return sageMessage.whisper(`Please see Help for [Color Management](<https://github.com/rpg-sage-creative/rpg-sage/wiki/Color-Management>).`);
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
	if (!sageMessage.canAdminGame) {
		return sageMessage.whisper(`Sorry, you aren't allowed to change Game colors.`);
	}

	const colorAndType = getColorAndType(sageMessage);
	if (!colorAndType) {
		return sageMessage.whisper(`Please see Help for [Color Management](<https://github.com/rpg-sage-creative/rpg-sage/wiki/Color-Management>).`);
	}

	const set = sageMessage.game!.colors.set(colorAndType);
	if (!set) {
		return sageMessage.whisper(`Sorry, we were unable set your color!`);
	}

	const saved = await sageMessage.game!.save();
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

	const colorType = sageMessage.args.getEnum(ColorType, "type")!;
	const unset = sageMessage.server.colors.unset(colorType);
	if (!unset) {
		return sageMessage.whisper(`Sorry, we were unable unset your color!`);
	}

	const saved = await sageMessage.server.save();
	if (!saved) {
		return sageMessage.whisper(`Sorry, we were unable unset your color!`);
	}

	return sageMessage.reactSuccess();
}

async function colorUnsetGame(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminGame) {
		return sageMessage.whisper(`Sorry, you aren't allowed to change Game colors.`);
	}

	const game = sageMessage.game!;

	const colorType = sageMessage.args.getEnum(ColorType, "type")!;
	const unset = game.colors.unset(colorType);
	if (!unset) {
		return sageMessage.whisper(`Sorry, we were unable unset your color!`);
	}

	const saved = await game.save();
	if (!saved) {
		return sageMessage.whisper(`Sorry, we were unable unset your color!`);
	}

	return sageMessage.reactSuccess();
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
}
