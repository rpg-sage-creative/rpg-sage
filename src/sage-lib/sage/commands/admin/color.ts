import type { Optional } from "../../../../sage-utils";
import { Collection } from "../../../../sage-utils/ArrayUtils";
import { exists } from "../../../../sage-utils/ArrayUtils";
import { errorReturnNull } from "../../../../sage-utils/ConsoleUtils";
import { discordPromptYesNo } from "../../../discord/prompts";
import type { Colors } from "../../model/Colors";
import type { TColorAndType } from "../../model/Colors";
import { ColorType } from "../../model/Colors";
import type { SageMessage } from "../../model/SageMessage";
import type { SageMessageArgs } from "../../model/SageMessageArgs";
import { BotServerGameType, embedColor, registerAdminCommand } from "../cmd";
import { registerAdminCommandHelp } from "../help";

//#region list

function getColors(sageMessage: SageMessage, which: BotServerGameType): Colors {
	if (which === BotServerGameType.Game && sageMessage.game) {
		return sageMessage.game.colors;
	}
	if (which === BotServerGameType.Server && sageMessage.server) {
		return sageMessage.server.colors;
	}
	return sageMessage.bot.colors;
}

async function _colorList(sageMessage: SageMessage, which: BotServerGameType): Promise<void> {
	const colors = getColors(sageMessage, which);
	let render = colors.size > 0;
	if (!render) {
		if (which !== BotServerGameType.Bot) {
			const colorName = which === BotServerGameType.Server ? "Server" : "Game";
			const otherName = which === BotServerGameType.Server ? "Sage" : "Server";
			const prompt = `**No ${colorName} Colors Found!**\n> Sync with ${otherName}?`;
			const booleanResponse = await discordPromptYesNo(sageMessage, prompt).catch(errorReturnNull);
			if (booleanResponse) {
				const otherColors = (which === BotServerGameType.Server ? sageMessage.bot : sageMessage.server ?? sageMessage.bot).colors;
				colors.sync(otherColors);
				const whichEntity = which === BotServerGameType.Server ? sageMessage.server : sageMessage.game;
				render = await whichEntity?.save() ?? false;
			}
		}
		if (!render) {
			return sageMessage.reactError("Unknown Error rendering Color List.");
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
		const embedGroups = Collection.partition(embeds, (_, index) => Math.floor(index / 10));
		for (const embedGroup of embedGroups) {
			await sageMessage.message.channel.send({ embeds:embedGroup });
		}
	}

	return Promise.resolve();
}

async function colorListBot(sageMessage: SageMessage): Promise<void> {
	return _colorList(sageMessage, BotServerGameType.Bot);
}

async function colorListServer(sageMessage: SageMessage): Promise<void> {
	return _colorList(sageMessage, BotServerGameType.Server);
}

async function colorListGame(sageMessage: SageMessage): Promise<void> {
	return _colorList(sageMessage, BotServerGameType.Game);
}

async function colorList(sageMessage: SageMessage): Promise<void> {
	return sageMessage.game ? colorListGame(sageMessage) : sageMessage.server ? colorListServer(sageMessage) : colorListBot(sageMessage);
}

//#endregion

//#region get

async function _colorGet(sageMessage: SageMessage, ...colors: Optional<Colors>[]): Promise<void> {
	colors = colors.filter(exists);

	const colorType = sageMessage.args.findEnum(ColorType, "type", true)!;
	let inherited = false;
	let color = colors.shift()!.get(colorType);
	while (!color && colors.length) {
		inherited = true;
		color = colors.shift()!.get(colorType);
	}
	if (!color) {
		const attemptedColor = ColorType[colorType] ?? sageMessage.args[0];
		return sageMessage.reactFailure(`Unable to find Color: ${attemptedColor}`);
	}

	const inheritedText = inherited ? ` (unset, inherited)` : ``;
	await sageMessage.message.channel.send({ embeds:[embedColor(color, ColorType[colorType], inheritedText)] });
}

async function colorGetBot(sageMessage: SageMessage): Promise<void> {
	return _colorGet(sageMessage, sageMessage.bot.colors);
}

async function colorGetServer(sageMessage: SageMessage): Promise<void> {
	return _colorGet(sageMessage, sageMessage.server?.colors, sageMessage.bot.colors);
}

async function colorGetGame(sageMessage: SageMessage): Promise<void> {
	return _colorGet(sageMessage, sageMessage.game?.colors, sageMessage.server?.colors, sageMessage.bot.colors);
}

async function colorGet(sageMessage: SageMessage): Promise<void> {
	return sageMessage.game ? colorGetGame(sageMessage) : sageMessage.server ? colorGetServer(sageMessage) : colorGetBot(sageMessage);
}

//#endregion

//#region set

/**
 * Returns both color and type from the args.
 * @todo ensure any calls to this expect the color and type to be keyed so that we can stop falling through to unkeyed args.
 */
function findColorAndType(args: SageMessageArgs): Optional<TColorAndType> {
	if (args.isEmpty) {
		return null;
	}
	const color = args.findColor("color", true),
		type = args.findEnum(ColorType, "type", true);
	if (color && type) {
		return { color, type };
	}
	if (color === undefined && type === undefined) {
		return undefined;
	}
	return null;
}

async function colorSetServer(sageMessage: SageMessage<true>): Promise<void> {
	const denial = sageMessage.checkDenyAdminServer("Set Server Color");
	if (denial) {
		return denial;
	}

	const colorAndType = findColorAndType(sageMessage.args);
	if (!colorAndType) {
		return sageMessage.reactFailure("Missing color and type values.");
	}

	const set = sageMessage.server.colors.set(colorAndType);
	if (!set) {
		return sageMessage.reactFailure("Invalid color or type values.");
	}

	const saved = await sageMessage.server.save();
	if (saved) {
		await sageMessage.message.channel.send({ embeds:[embedColor(colorAndType.color, ColorType[colorAndType.type])] });
	}
	await sageMessage.reactSuccessOrFailure(saved, "Server Color Set.", "Unknown Error; Server Color NOT Set!");
	return Promise.resolve();
}

async function colorSetGame(sageMessage: SageMessage): Promise<void> {
	const denial = sageMessage.checkDenyAdminGame("Set Game Color");
	if (denial) {
		return denial;
	}

	const game = sageMessage.game!;

	const colorAndType = findColorAndType(sageMessage.args);
	if (!colorAndType) {
		return sageMessage.reactFailure("Missing color and type values.");
	}

	const set = game.colors.set(colorAndType);
	if (!set) {
		return sageMessage.reactFailure("Invalid color or type values.");
	}

	const saved = await game.save();
	if (saved) {
		await sageMessage.message.channel.send({ embeds:[embedColor(colorAndType.color, ColorType[colorAndType.type])] });
	}
	await sageMessage.reactSuccessOrFailure(saved, "Game Color Set.", "Unknown Error; Game Color NOT Set!");
	return Promise.resolve();
}

async function colorSet(sageMessage: SageMessage): Promise<void> {
	return sageMessage.game ? colorSetGame(sageMessage) : colorSetServer(sageMessage);
}

//#endregion

//#region sync

async function colorSyncServer(sageMessage: SageMessage<true>): Promise<void> {
	const denial = sageMessage.checkDenyAdminServer("Reset Server Colors");
	if (denial) {
		return denial;
	}

	const server = sageMessage.server;

	const booleanResponse = await discordPromptYesNo(sageMessage, "> Reset colors to Sage defaults?");
	if (booleanResponse) {
		server.colors.sync(sageMessage.bot.colors);
		const saved = await server.save();
		if (!saved) {
			sageMessage.reactError("Unable to save Server.");
		} else {
			colorListServer(sageMessage);
		}
	}
	return Promise.resolve();
}

async function colorSyncGame(sageMessage: SageMessage): Promise<void> {
	const denial = sageMessage.checkDenyAdminGame("Reset Game Colors");
	if (denial) {
		return denial;
	}

	const game = sageMessage.game!;

	const booleanResponse = await discordPromptYesNo(sageMessage, "> Reset colors to Server defaults?");
	if (booleanResponse) {
		game.colors.sync(game.server.colors);
		const saved = await game.save();
		if (!saved) {
			sageMessage.reactError("Unable to save Game.");
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

async function colorUnsetServer(sageMessage: SageMessage<true>): Promise<void> {
	const denial = sageMessage.checkDenyAdminServer("Unset Server Color");
	if (denial) {
		return denial;
	}

	const colorType = sageMessage.args.findEnum(ColorType, "type", true);
	const unset = sageMessage.server.colors.unset(colorType);
	if (!unset) {
		return sageMessage.reactFailure("Invalid color type.");
	}

	const saved = await sageMessage.server.save();
	return sageMessage.reactSuccessOrFailure(saved, "Server Color Unset.", "Unknown Error; Server Color NOT Unset!");
}

async function colorUnsetGame(sageMessage: SageMessage): Promise<void> {
	const denial = sageMessage.checkDenyAdminGame("Unset Game Color");
	if (denial) {
		return denial;
	}

	const game = sageMessage.game!;

	const colorType = sageMessage.args.findEnum(ColorType, "type", true);
	const unset = game.colors.unset(colorType);
	if (!unset) {
		return sageMessage.reactFailure("Invalid color type.");
	}

	const saved = await game.save();
	return sageMessage.reactSuccessOrFailure(saved, "Game Color Unset.", "Unknown Error; Game Color NOT Unset!");
}

async function colorUnset(sageMessage: SageMessage): Promise<void> {
	return sageMessage.game ? colorUnsetGame(sageMessage) : colorUnsetServer(sageMessage);
}

//#endregion

export function register(): void {
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

	registerAdminCommandHelp("Admin", "Color", "color get type=\"ColorType\"");
	registerAdminCommandHelp("Admin", "Color", "color get game type=\"ColorType\"");
	registerAdminCommandHelp("Admin", "Color", "color get server type=\"ColorType\"");

	registerAdminCommandHelp("Admin", "Color", "color list");
	registerAdminCommandHelp("Admin", "Color", "color list game");
	registerAdminCommandHelp("Admin", "Color", "color list server");

	registerAdminCommandHelp("Admin", "Color", "color set type=\"ColorType\" value=\"hexColorValue\"");
	registerAdminCommandHelp("Admin", "Color", "color set game type=\"ColorType\" value=\"hexColorValue\"");
	registerAdminCommandHelp("Admin", "Color", "color set server type=\"ColorType\" value=\"hexColorValue\"");

	registerAdminCommandHelp("Admin", "Color", "color sync");
	registerAdminCommandHelp("Admin", "Color", "color sync game");
	registerAdminCommandHelp("Admin", "Color", "color sync server");

	registerAdminCommandHelp("Admin", "Color", "color unset type=\"ColorType\"");
	registerAdminCommandHelp("Admin", "Color", "color unset game type=\"ColorType\"");
	registerAdminCommandHelp("Admin", "Color", "color unset server type=\"ColorType\"");
}
