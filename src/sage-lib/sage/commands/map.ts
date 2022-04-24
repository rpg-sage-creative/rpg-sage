import * as Discord from "discord.js";
import type { Optional } from "../../../sage-utils";
import { errorReturnNull } from "../../../sage-utils/utils/ConsoleUtils/Catchers";
import { getText } from "../../../sage-utils/utils/HttpsUtils";
import { capitalize, StringMatcher } from "../../../sage-utils/utils/StringUtils";
import { registerSlashCommand } from "../../../slash.mjs";
import type { TSlashCommand } from "../../../types";
import { DiscordId, TChannel, TCommandAndArgsAndData } from "../../discord";
import { registerInteractionListener, registerMessageListener } from "../../discord/handlers";
import { discordPromptYesNoDeletable } from "../../discord/prompts";
import ActiveBot from "../model/ActiveBot";
import type SageInteraction from "../model/SageInteraction";
import type SageMessage from "../model/SageMessage";
import GameMap, { TMoveDirection } from "./map/GameMap";
import { COL, LayerType, ROW, TGameMapAura, TGameMapCore, TGameMapImage, TGameMapTerrain, TGameMapToken } from "./map/GameMapBase";
import gameMapImporter, { TParsedGameMapCore } from "./map/gameMapImporter";

//#region buttons

type TMapAction = "MapUpLeft"   | "MapUp"     | "MapUpRight"   | "MapTerrain" | "MapRaise"
				| "MapLeft"     | "MapConfig" | "MapRight"     | "MapAura"    | "MapDelete"
				| "MapDownLeft" | "MapDown"   | "MapDownRight" | "MapToken"   | "MapLower";

	const MapActions = "MapUpLeft,MapUp,MapUpRight,MapTerrain,MapRaise,MapLeft,MapConfig,MapRight,MapAura,MapDelete,MapDownLeft,MapDown,MapDownRight,MapToken,MapLower".split(",");
	const MapActionEmojis = "↖️,⬆️,↗️,⛰️,🔼,⬅️,⚙️,➡️,🟡,❌,↙️,⬇️,↘️,👤,🔽".split(",");

function createButton(customId: string, label: string, style: Discord.MessageButtonStyleResolvable): Discord.MessageButton {
	const button = new Discord.MessageButton();
	button.setCustomId(customId);
	if (MapActions.includes(label)) {
		button.setEmoji(MapActionEmojis[MapActions.indexOf(label)]);
	}else {
		button.setLabel(label);
	}
	button.setStyle(style);
	return button;
}

function createButtonRow(mapId: Discord.Snowflake, ...labels: TMapAction[]): Discord.MessageActionRow {
	const actionRow = new Discord.MessageActionRow();
	labels.forEach(label => actionRow.addComponents(createButton(`${mapId}|${label}`, label, "SECONDARY")));
	return actionRow;
}

function createMapComponents(gameMap: GameMap): Discord.MessageActionRow[] {
	return [
		createButtonRow(gameMap.id, "MapUpLeft", "MapUp", "MapUpRight", "MapTerrain", "MapRaise"),
		createButtonRow(gameMap.id, "MapLeft", "MapConfig", "MapRight", "MapAura", "MapDelete"),
		createButtonRow(gameMap.id, "MapDownLeft", "MapDown", "MapDownRight", "MapToken", "MapLower")
	];
}

//#endregion

//#region token movement

/** get text for human readable direction */
function toDirection(action: TMapAction): string {
	switch(action) {
		case "MapUpLeft": return "up and left";
		case "MapUp": return "up";
		case "MapUpRight": return "up and right";
		case "MapLeft": return "left";
		case "MapRight": return "right";
		case "MapDownLeft": return "down and left";
		case "MapDown": return "down";
		case "MapDownRight": return "down and right";
		default: return "";
	}
}

//#endregion

/** If the user is a player in a game, this will ensure their tokens (pc/companions) are on the map */
function ensurePlayerCharacter(sageInteraction: SageInteraction, gameMap: GameMap): boolean {
	const pc = sageInteraction.playerCharacter;
	if (!pc) {
		return false;
	}
	let updated = false;
	[pc].concat(pc.companions).forEach(char => {
		const imageUrl = char.tokenUrl ?? char.avatarUrl;
		if (imageUrl) {
			const found = gameMap.tokens.find(token => token.id === char.id);
			if (!found) {
				sageInteraction.reply(`Adding token for ${char.name} ...`, true);
				gameMap.tokens.push({
					auras: [],
					characterId: char.id,
					id: Discord.SnowflakeUtil.generate(),
					layer: LayerType.Token,
					name: char.name,
					pos: gameMap.spawn ?? [1,1],
					size: [1,1],
					url: pc.tokenUrl ?? pc.avatarUrl!,
					userId: sageInteraction.user.id
				});
				updated = true;
			}else if (found.name !== char.name || found.url !== imageUrl) {
				sageInteraction.reply(`Updating token for ${char.name} ...`, true);
				found.name = char.name;
				found.url = imageUrl;
				updated = true;
			}
		}
	});
	return updated;
}

async function actionHandlerMapTerrain(sageInteraction: SageInteraction, gameMap: GameMap): Promise<void> {
	const toggled = gameMap.cycleActiveTerrain();
	const activeTerrain = gameMap.activeTerrain;
	sageInteraction.reply(`Setting ${activeTerrain?.name} as active ...`, true);
	const updated = toggled && await gameMap.save();
	if (updated) {
		return sageInteraction.reply(`Your active terrain is: ${activeTerrain?.name ?? "Unknown"}`, true);
	}
	return sageInteraction.deleteReply();
}

async function actionHandlerMapAura(sageInteraction: SageInteraction, gameMap: GameMap): Promise<void> {
	const activeToken = gameMap.activeToken;
	let updated = ensurePlayerCharacter(sageInteraction, gameMap);
	const toggled = gameMap.cycleActiveAura();
	const toggledAura = gameMap.activeAura;
	sageInteraction.reply(`Setting active aura for ${activeToken?.name} to ${toggledAura?.name ?? "none"} ...`, true);
	updated = toggled
		&& await renderMap(sageInteraction.interaction.message as Discord.Message, gameMap);
	if (updated) {
		return sageInteraction.reply(`Your active aura for ${activeToken?.name} is: ${toggledAura?.name ?? "none"}`, true);
	}
	return sageInteraction.deleteReply();
}

async function actionHandlerMapToken(sageInteraction: SageInteraction, gameMap: GameMap): Promise<void> {
	const added = ensurePlayerCharacter(sageInteraction, gameMap);
	const toggled = gameMap.cycleActiveToken();
	const activeToken = gameMap.activeToken;
	sageInteraction.reply(`Setting ${activeToken?.name} as active ...`, true);
	let updated = false;
	if (added) {
		updated = await renderMap(sageInteraction.interaction.message as Discord.Message, gameMap);
	}else {
		updated = toggled && await gameMap.save();
	}
	if (updated) {
		return sageInteraction.reply(`Your active token is: ${activeToken?.name ?? "Unknown"}`, true);
	}
	return sageInteraction.deleteReply();
}

async function actionHandlerMapRaise(sageInteraction: SageInteraction, gameMap: GameMap): Promise<void> {
	if (!gameMap.isOwner) {
		return sageInteraction.reply(`You can't edit somebody else's map!`, true);
	}
	let updated = false;
	let output = "";
	switch(gameMap.activeLayer) {
		case LayerType.Aura:
			updated = gameMap.shiftOpacity("up");
			sageInteraction.reply(`Increasing Aura Opacity: ${gameMap.activeAura?.name ?? "Unknown"}`, true);
			output = `Aura Opacity Increased: ${gameMap.activeAura?.name ?? "Unknown"}`;
			break;
		case LayerType.Terrain:
			updated = gameMap.shuffleActiveTerrain("up");
			sageInteraction.reply(`Raising Terrain: ${gameMap.activeTerrain?.name ?? "Unknown"}`, true);
			output = `Terrain Raised: ${gameMap.activeTerrain?.name ?? "Unknown"}`;
			break;
		case LayerType.Token:
		default:
			updated = gameMap.shuffleActiveToken("up");
			sageInteraction.reply(`Raising Token: ${gameMap.activeToken?.name ?? "Unknown"}`, true);
			output = `Token Raised: ${gameMap.activeToken?.name ?? "Unknown"}`;
			break;
	}
	if (updated) {
		updated = await renderMap(sageInteraction.interaction.message as Discord.Message, gameMap);
	}
	if (updated) {
		return sageInteraction.reply(output, true);
	}
	return sageInteraction.deleteReply();
}

async function actionHandlerMapLower(sageInteraction: SageInteraction, gameMap: GameMap): Promise<void> {
	if (!gameMap.isOwner) {
		return sageInteraction.reply(`You can't edit somebody else's map!`, true);
	}
	let updated = false;
	let output = "";
	switch(gameMap.activeLayer) {
		case LayerType.Aura:
			updated = gameMap.shiftOpacity("down");
			sageInteraction.reply(`Decreasing Aura Opacity: ${gameMap.activeAura?.name ?? "Unknown"}`, true);
			output = `Aura Opacity Decreased: ${gameMap.activeAura?.name ?? "Unknown"}`;
			break;
		case LayerType.Terrain:
			updated = gameMap.shuffleActiveTerrain("down");
			sageInteraction.reply(`Lowering Terain: ${gameMap.activeTerrain?.name ?? "Unknown"}`, true);
			output = `Terrain Lowered: ${gameMap.activeTerrain?.name ?? "Unknown"}`;
			break;
		case LayerType.Token:
		default:
			updated = gameMap.shuffleActiveToken("down");
			sageInteraction.reply(`Lowering Token: ${gameMap.activeToken?.name ?? "Unknown"}`, true);
			output = `Token Lowered: ${gameMap.activeToken?.name ?? "Unknown"}`;
			break;
	}
	if (updated) {
		updated = await renderMap(sageInteraction.interaction.message as Discord.Message, gameMap);
	}
	if (updated) {
		return sageInteraction.reply(output, true);
	}
	return sageInteraction.deleteReply();
}

async function actionHandlerMapConfig(sageInteraction: SageInteraction, _: GameMap): Promise<void> {
	return sageInteraction.reply(`Coming Soon ...`, false);
}
async function actionHandlerMapDelete(sageInteraction: SageInteraction, _: GameMap): Promise<void> {
	return sageInteraction.reply(`Coming Soon ...`, false);
}
async function actionHandlerMapMove(sageInteraction: SageInteraction, actionData: TActionData): Promise<void> {
	const gameMap = actionData.gameMap;
	let updated = ensurePlayerCharacter(sageInteraction, gameMap);
	const activeImage = gameMap.activeImage;
	const mapAction = actionData.mapAction;
	if (activeImage) {
		sageInteraction.reply(`Moving ${activeImage.name} ${toDirection(mapAction)} ...`, false);
		const moved = gameMap.moveActiveToken(mapAction.slice(3).toLowerCase() as TMoveDirection);
		const shuffled = gameMap.activeLayer === LayerType.Token ? gameMap.shuffleActiveToken("top") : false;
		updated = (moved || shuffled)
			&& await renderMap(sageInteraction.interaction.message as Discord.Message, gameMap);
		if (updated) {
			return sageInteraction.deleteReply();
		}
		return sageInteraction.reply(`Error moving token ...`, false);
	}
	return sageInteraction.reply(`You have no token to move ...`, true);
}
async function actionHandler(sageInteraction: SageInteraction, actionData: TActionData): Promise<void> {
	const gameMap = actionData.gameMap;
	switch(actionData.mapAction) {
		case "MapConfig": return actionHandlerMapConfig(sageInteraction, gameMap);
		case "MapTerrain": return actionHandlerMapTerrain(sageInteraction, gameMap);
		case "MapAura": return actionHandlerMapAura(sageInteraction, gameMap);
		case "MapToken": return actionHandlerMapToken(sageInteraction, gameMap);
		case "MapRaise": return actionHandlerMapRaise(sageInteraction, gameMap);
		case "MapDelete": return actionHandlerMapDelete(sageInteraction, gameMap);
		case "MapLower": return actionHandlerMapLower(sageInteraction, gameMap);
		default: return actionHandlerMapMove(sageInteraction, actionData);
	}
}

//#region map import handler

async function mapImportTester(sageMessage: SageMessage): Promise<TCommandAndArgsAndData<TParsedGameMapCore> | null> {
	const attachments = sageMessage.message.attachments;
	if (!attachments.size) {
		return null;
	}
	const client = ActiveBot.active.client;
	for (const att of attachments) {
		const url = att[1].attachment.toString();
		if (url.match(/map\.txt$/i)) {
			const raw = await getText(url);
			const parsedCore = gameMapImporter(raw, client);
			if (parsedCore) {
				return {
					data: parsedCore
				};
			}
		}
	}
	return null;
}
async function del(msg?: Discord.Message | null): Promise<Discord.Message | null> {
	return msg?.deletable ? msg.delete() : msg ?? null;
}
async function mapImportHandler(sageMessage: SageMessage, mapCore: TGameMapCore): Promise<void> {
	const channel = sageMessage.message.channel;
	const [boolImport, msgImport] = await discordPromptYesNoDeletable(sageMessage, `Try to import map: ${mapCore.name}?`);
	if (boolImport) {
		const pwConfiguring = await channel.send(`Importing and configuring: ${mapCore.name} ...`);
		del(msgImport);
		if (!mapCore.userId) {
			mapCore.userId = sageMessage.sageUser.did;
		}
		const success = await renderMap(channel as TChannel, new GameMap(mapCore, mapCore.userId));
		if (!success) {
			await channel.send(`Sorry, something went wrong importing the map.`);
		}
		del(pwConfiguring);
	}
	del(msgImport);
}

//#endregion

export function registerCommandHandlers(): void {
	registerInteractionListener(actionTester, actionHandler);
	registerInteractionListener(mapCreateTester, mapCreateHandler);
	registerInteractionListener(mapAuraTester, mapAuraHandler);
	registerInteractionListener(mapTerrainTester, mapTerrainHandler);
	registerInteractionListener(mapTokenTester, mapTokenHandler);
	registerMessageListener(mapImportTester, mapImportHandler);
}

//#region interaction listener testers

type TActionData = { gameMap:GameMap; mapAction:TMapAction; };

/** Returns action data (mapCore and mapAction) or undefined */
async function actionTester(sageInteration: SageInteraction): Promise<TActionData | undefined> {
	// const [mapId, mapAction] = (sageInteration.interaction.customId ?? "").split("|") as [Discord.Snowflake, TMapAction];
	const mapAction = (sageInteration.interaction.customId ?? "").split("|")[1] as TMapAction;
	const messageId = sageInteration.interaction.message.id;
	if (MapActions.includes(mapAction) && GameMap.exists(messageId)) {
		const gameMap = await GameMap.forUser(messageId, sageInteration.user.id, true);
		if (gameMap) {
			return { gameMap, mapAction };
		}
	}
	return undefined;
}

function mapCreateTester(sageInteraction: SageInteraction): boolean {
	return !!sageInteraction.interaction.channel
		&& sageInteraction.isCommand("map", "create");
}

function mapAuraTester(sageInteraction: SageInteraction): boolean {
	return !!sageInteraction.interaction.channel
		&& sageInteraction.isCommand("Map", "AddImage")
		&& sageInteraction.getString("layer") === "aura";
}

function mapTerrainTester(sageInteraction: SageInteraction): boolean {
	return !!sageInteraction.interaction.channel
		&& sageInteraction.isCommand("Map", "AddImage")
		&& sageInteraction.getString("layer") === "terrain";
}

function mapTokenTester(sageInteraction: SageInteraction): boolean {
	return !!sageInteraction.interaction.channel
		&& sageInteraction.isCommand("Map", "AddImage")
		&& sageInteraction.getString("layer") === "token";
}

//#endregion

//#region interaction listener handlers

/** creates a new map from the interaction */
async function mapCreateHandler(sageInteraction: SageInteraction): Promise<void> {
	sageInteraction.reply(`Fetching image and configuring map ...`, true);

	const userId = sageInteraction.user.id;

	const clip = sageInteraction.getString("clip")?.split(",").map(s => +s);
	const spawn = sageInteraction.getString("spawn")?.split(",").map(s => +s) ?? [];

	const mapCore: TGameMapCore = {
		activeMap: {},
		auras: [],
		clip: clip as [number, number, number, number],
		grid: [sageInteraction.getNumber("cols", true), sageInteraction.getNumber("rows", true)],
		id: Discord.SnowflakeUtil.generate(),
		messageId: undefined!,
		name: sageInteraction.getString("name", true),
		spawn: spawn as [number, number],
		terrain: [],
		tokens: [],
		url: sageInteraction.getString("url", true),
		userId: userId
	};

	const success = await renderMap(sageInteraction.interaction.channel as TChannel, new GameMap(mapCore, userId));
	if (success) {
		return sageInteraction.deleteReply();
	}

	return sageInteraction.reply(`Sorry, something went wrong.`, true);
}

async function mapAuraHandler(sageInteraction: SageInteraction): Promise<void> {
	sageInteraction.reply(`Fetching image and adding to map ...`, true);
	const [gameMap, aura] = await parseInput<TGameMapAura>(sageInteraction);
	if (!gameMap || !aura) {
		return Promise.resolve();
	}

	aura.opacity = 0.5;

	const anchorName = sageInteraction.getString("anchor");
	const matcher = new StringMatcher(anchorName);
	const anchor = gameMap.userTokens.find(token => matcher.matches(token.name));
	if (anchor) {
		aura.anchorId = anchor.id;
		anchor.auras.push(aura);
		anchor.auraId = aura.id;
		gameMap.activeImage = anchor;
	}else {
		gameMap.auras.push(aura);
		gameMap.activeImage = aura;
	}

	const message = await sageInteraction.interaction.channel?.messages.fetch(gameMap.messageId);
	const success = await renderMap(message, gameMap);

	if (success) {
		return sageInteraction.deleteReply();
	}

	return sageInteraction.reply(`Sorry, something went wrong.`, true);
}

async function mapTerrainHandler(sageInteraction: SageInteraction): Promise<void> {
	sageInteraction.reply(`Fetching image and adding to map ...`, true);
	const [gameMap, terrain] = await parseInput<TGameMapTerrain>(sageInteraction);
	if (!gameMap || !terrain) {
		return Promise.resolve();
	}

	gameMap.terrain.push(terrain);
	gameMap.activeImage = terrain;

	const message = await sageInteraction.interaction.channel?.messages.fetch(gameMap.messageId);
	const success = await renderMap(message, gameMap);

	if (success) {
		return sageInteraction.deleteReply();
	}

	return sageInteraction.reply(`Sorry, something went wrong.`, true);
}

async function mapTokenHandler(sageInteraction: SageInteraction): Promise<void> {
	sageInteraction.reply(`Fetching image and adding to map ...`, true);
	const [gameMap, token] = await parseInput<TGameMapToken>(sageInteraction);
	if (!gameMap || !token) {
		return Promise.resolve();
	}

	gameMap.tokens.push(token);
	gameMap.activeImage = token;

	const message = await sageInteraction.interaction.channel?.messages.fetch(gameMap.messageId);
	const success = await renderMap(message, gameMap);

	if (success) {
		return sageInteraction.deleteReply();
	}

	return sageInteraction.reply(`Sorry, something went wrong.`, true);
}

//#endregion

/** reads the interaction's channel's messages to find the map */
async function findGameMap(sageInteraction: SageInteraction): Promise<GameMap | null> {
	const mapValue = sageInteraction.getString("map", true);
	if (DiscordId.isValidId(mapValue)) {
		return GameMap.forUser(mapValue, sageInteraction.user.id);
	}
	const messages = await sageInteraction.interaction.channel?.messages.fetch();
	if (!messages) {
		return null;
	}
	let messageId: Discord.Snowflake | undefined;
	messages.find(msg => {
		if (msg.attachments.size && msg.components.length && GameMap.matches(msg.id, mapValue)) {
			messageId = msg.id;
			return true;
		}
		return false;
	});
	return messageId
		? GameMap.forUser(messageId, sageInteraction.user.id)
		: null;
}

async function parseInput<T extends TGameMapImage>(sageInteraction: SageInteraction): Promise<[GameMap | null, T | null]> {
	const gameMap = await findGameMap(sageInteraction);
	if (!gameMap) {
		await sageInteraction.reply("Invalid Map!", true);
		return [null, null];
	}

	const layerValue = capitalize(sageInteraction.getString("layer", true)) as "Aura" | "Terrain" | "Token";

	const image: TGameMapImage = {
		auras: [],
		id: Discord.SnowflakeUtil.generate(),
		layer: LayerType[layerValue],
		name: sageInteraction.getString("name", true),
		pos: [
			sageInteraction.getNumber("col") ?? gameMap.spawn[COL],
			sageInteraction.getNumber("row") ?? gameMap.spawn[ROW]
		],
		size: [
			sageInteraction.getNumber("cols") ?? 1,
			sageInteraction.getNumber("rows") ?? 1
		],
		url: sageInteraction.getString("url", true),
		userId: sageInteraction.user.id
	};

	return [gameMap, image as T];
}

async function renderMap(messageOrChannel: Optional<Discord.Message | TChannel>, gameMap: GameMap): Promise<boolean> {
	if (!messageOrChannel) {
		return false;
	}
	const buffer = await gameMap.toRenderable().render();
	if (buffer) {
		const content = `**${gameMap.name}**`;
		const files = [buffer];
		const components = createMapComponents(gameMap);
		const message = messageOrChannel instanceof Discord.Message
			? await messageOrChannel.edit({ content, files, components }).catch(errorReturnNull)
			: await messageOrChannel.send({ content, files, components }).catch(errorReturnNull);
		if (message) {
			gameMap.messageId = message.id;
			return gameMap.save();
		}
	}
	return false;
}

function mapCommand(): TSlashCommand {
	const isNumber = true;
	const isRequired = true;
	return {
		name: "Map",
		description: "Map Commands",
		children: [
			{
				name: "Create",
				description: "Sets the map for this channel.",
				options: [
					{ name:"url", description:"Url to the map image.", isRequired },
					{ name:"name", description:"What do you call this map?", isRequired },
					{ name:"cols", description:"How many columns on this map?", isNumber, isRequired },
					{ name:"rows", description:"How many rows on this map?", isNumber, isRequired },
					{ name:"spawn", description:"Grid location to spawn new images. Default: 1,1 " },
					{ name:"clip", description:"(Advanced) How to clip map's source image: dx,dY,dW,dH" }
				]
			},
			{
				name: "AddImage",
				description: "Adds an image to a map",
				options: [
					{ name:"map", description:"Map Id?", isRequired, },
					{ name:"layer", description:"Which map layer?", isRequired, choices:["aura","terrain","token"] },
					{ name:"url", description:"Url to the token image.", isRequired },
					{ name:"name", description:"What/Who is this image?", isRequired },
					{ name:"cols", description:"How many columns wide is this image?", isNumber, isRequired },
					{ name:"rows", description:"How many rows tall is this image?", isNumber, isRequired },
					{ name:"col", description:"Column # (starting with 1) to place this image's top left corner.", isNumber, isRequired },
					{ name:"row", description:"Row # (starting with 1) to place this image's top left corner.", isNumber, isRequired }
				]
			}
		]
	};
}

export function registerSlashCommands(): void {
	registerSlashCommand(mapCommand());
}
