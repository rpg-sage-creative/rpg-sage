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
import SageInteraction from "../model/SageInteraction";
import type SageMessage from "../model/SageMessage";
import GameMap, { TCompassDirection, TMoveDirection } from "./map/GameMap";
import { COL, LayerType, ROW, TGameMapAura, TGameMapCore, TGameMapImage, TGameMapTerrain, TGameMapToken } from "./map/GameMapBase";
import gameMapImporter, { TParsedGameMapCore } from "./map/gameMapImporter";
import { registerCommandRegex } from "./cmd";

//#region buttons

type TMapAction = "MapUpLeft"   | "MapUp"     | "MapUpRight"   | "MapTerrain" | "MapRaise"
				| "MapLeft"     | "MapConfig" | "MapRight"     | "MapAura"    | "MapDelete"
				| "MapDownLeft" | "MapDown"   | "MapDownRight" | "MapToken"   | "MapLower";

	const MapActions = "MapUpLeft,MapUp,MapUpRight,MapTerrain,MapRaise,MapLeft,MapConfig,MapRight,MapAura,MapDelete,MapDownLeft,MapDown,MapDownRight,MapToken,MapLower".split(",");
	const MapActionEmojis = "↖️,⬆️,↗️,⛰️,🔼,⬅️,⚙️,➡️,🟡,❌,↙️,⬇️,↘️,👤,🔽".split(",");

function createButton(gameMap: GameMap, label: string, style: Discord.MessageButtonStyleResolvable): Discord.MessageButton {
	const button = new Discord.MessageButton();
	button.setCustomId(`${gameMap.id}|${label}`);
	if (MapActions.includes(label)) {
		button.setEmoji(MapActionEmojis[MapActions.indexOf(label)]);
	}else {
		button.setLabel(label);
	}
	if (label === "MapConfig") {
		button.setDisabled(true);
	}
	if (label === "MapAura") {
		button.setDisabled(gameMap.auras.length === 0);
	}
	if (label === "MapTerrain") {
		button.setDisabled(gameMap.terrain.length === 0);
	}
	button.setStyle(style);
	return button;
}

function createButtonRow(gameMap: GameMap, ...labels: TMapAction[]): Discord.MessageActionRow {
	const actionRow = new Discord.MessageActionRow();
	labels.forEach(label => actionRow.addComponents(createButton(gameMap, label, "SECONDARY")));
	return actionRow;
}

function createMapComponents(gameMap: GameMap): Discord.MessageActionRow[] {
	return [
		createButtonRow(gameMap, "MapUpLeft", "MapUp", "MapUpRight", "MapTerrain", "MapRaise"),
		createButtonRow(gameMap, "MapLeft", "MapConfig", "MapRight", "MapAura", "MapDelete"),
		createButtonRow(gameMap, "MapDownLeft", "MapDown", "MapDownRight", "MapToken", "MapLower")
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
function ensurePlayerCharacter(sageCommand: SageInteraction | SageMessage, gameMap: GameMap): boolean {
	const reply = "message" in sageCommand ? sageCommand.message.reply : sageCommand.reply;

	const pc = sageCommand.playerCharacter;
	if (!pc) {
		return false;
	}
	let updated = false;
	[pc].concat(pc.companions).forEach(char => {
		const charUrl = char.tokenUrl ?? char.avatarUrl;
		if (charUrl) {
			const charName = char.name;
			const found = gameMap.tokens.find(token => token.characterId === char.id)
				?? gameMap.tokens.find(token => token.name === charName)
				?? gameMap.tokens.find(token => token.url === charUrl);
			if (!found) {
				reply(`Adding token for ${charName} ...`, false);
				gameMap.tokens.push({
					auras: [],
					characterId: char.id,
					id: Discord.SnowflakeUtil.generate(),
					layer: LayerType.Token,
					name: charName,
					pos: gameMap.spawn ?? [1,1],
					size: [1,1],
					url: charUrl,
					userId: sageCommand.sageUser.did
				});
				updated = true;
			}else {
				if (found.name !== charName || found.url !== charUrl) {
					reply(`Updating token for ${charName} ...`, false);
					found.name = charName;
					found.url = charUrl;
					updated = true;
				}
				if (found.characterId !== char.id) {
					// link id to pc/companion
					found.characterId = char.id;
					updated = true;
				}
			}
		}
	});
	return updated;
}

async function actionHandlerMapTerrain(sageInteraction: SageInteraction, gameMap: GameMap): Promise<void> {
	const toggled = gameMap.cycleActiveTerrain();
	const activeTerrain = gameMap.activeTerrain;
	sageInteraction.reply(`Setting ${activeTerrain?.name} as active ...`, false);
	const updated = toggled && await gameMap.save();
	if (updated) {
		return sageInteraction.reply(`Your active terrain is: ${activeTerrain?.name ?? "Unknown"}`, false);
	}
	return sageInteraction.deleteReply();
}

async function actionHandlerMapAura(sageInteraction: SageInteraction, gameMap: GameMap): Promise<void> {
	const activeToken = gameMap.activeToken;
	let updated = ensurePlayerCharacter(sageInteraction, gameMap);
	const toggled = gameMap.cycleActiveAura();
	const toggledAura = gameMap.activeAura;
	sageInteraction.reply(`Setting active aura for ${activeToken?.name} to ${toggledAura?.name ?? "none"} ...`, false);
	updated = toggled
		&& await renderMap(sageInteraction.interaction.message as Discord.Message, gameMap);
	if (updated) {
		return sageInteraction.reply(`Your active aura for ${activeToken?.name} is: ${toggledAura?.name ?? "none"}`, false);
	}
	return sageInteraction.deleteReply();
}

async function actionHandlerMapToken(sageInteraction: SageInteraction, gameMap: GameMap): Promise<void> {
	const added = ensurePlayerCharacter(sageInteraction, gameMap);
	const toggled = gameMap.cycleActiveToken();
	const activeToken = gameMap.activeToken;
	sageInteraction.reply(`Setting ${activeToken?.name} as active ...`, false);
	let updated = false;
	if (added) {
		updated = await renderMap(sageInteraction.interaction.message as Discord.Message, gameMap);
	}else {
		updated = toggled && await gameMap.save();
	}
	if (updated) {
		return sageInteraction.reply(`Your active token is: ${activeToken?.name ?? "Unknown"}`, false);
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
			sageInteraction.reply(`Increasing Aura Opacity: ${gameMap.activeAura?.name ?? "Unknown"}`, false);
			output = `Aura Opacity Increased: ${gameMap.activeAura?.name ?? "Unknown"}`;
			break;
		case LayerType.Terrain:
			updated = gameMap.shuffleActiveTerrain("up");
			sageInteraction.reply(`Raising Terrain: ${gameMap.activeTerrain?.name ?? "Unknown"}`, false);
			output = `Terrain Raised: ${gameMap.activeTerrain?.name ?? "Unknown"}`;
			break;
		case LayerType.Token:
		default:
			updated = gameMap.shuffleActiveToken("up");
			sageInteraction.reply(`Raising Token: ${gameMap.activeToken?.name ?? "Unknown"}`, false);
			output = `Token Raised: ${gameMap.activeToken?.name ?? "Unknown"}`;
			break;
	}
	if (updated) {
		updated = await renderMap(sageInteraction.interaction.message as Discord.Message, gameMap);
	}
	if (updated) {
		return sageInteraction.reply(output, false);
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
			sageInteraction.reply(`Decreasing Aura Opacity: ${gameMap.activeAura?.name ?? "Unknown"}`, false);
			output = `Aura Opacity Decreased: ${gameMap.activeAura?.name ?? "Unknown"}`;
			break;
		case LayerType.Terrain:
			updated = gameMap.shuffleActiveTerrain("down");
			sageInteraction.reply(`Lowering Terain: ${gameMap.activeTerrain?.name ?? "Unknown"}`, false);
			output = `Terrain Lowered: ${gameMap.activeTerrain?.name ?? "Unknown"}`;
			break;
		case LayerType.Token:
		default:
			updated = gameMap.shuffleActiveToken("down");
			sageInteraction.reply(`Lowering Token: ${gameMap.activeToken?.name ?? "Unknown"}`, false);
			output = `Token Lowered: ${gameMap.activeToken?.name ?? "Unknown"}`;
			break;
	}
	if (updated) {
		updated = await renderMap(sageInteraction.interaction.message as Discord.Message, gameMap);
	}
	if (updated) {
		return sageInteraction.reply(output, false);
	}
	return sageInteraction.deleteReply();
}

async function actionHandlerMapConfig(sageInteraction: SageInteraction, _: GameMap): Promise<void> {
	return sageInteraction.reply(`Coming Soon ...`, true);
}

async function actionHandlerMapDelete(sageInteraction: SageInteraction, gameMap: GameMap): Promise<void> {
	const activeImage = gameMap.activeImage;
	if (activeImage) {
		await sageInteraction.reply(`Deleting image: ${activeImage.name} ...`, false);
		const [boolConfirm, msgConfirm] = await discordPromptYesNoDeletable(sageInteraction, `Delete image: ${activeImage.name}?`);
		if (boolConfirm) {
			del(msgConfirm);
			const deleted = gameMap.deleteImage(activeImage);
			const updated = deleted
				&& await renderMap(sageInteraction.interaction.message as Discord.Message, gameMap);
			if (updated) {
				return sageInteraction.reply(`Deleted image: ${activeImage.name}`, false);
			}
			return sageInteraction.reply(`Error deleting image ...`, false);
		}
		del(msgConfirm);
		return sageInteraction.deleteReply();
	}else {
		return sageInteraction.reply(`You have no image to delete ...`, true);
	}
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
		return sageInteraction.reply(`Error moving image ...`, false);
	}
	return sageInteraction.reply(`You have no image to move ...`, true);
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
	// registerInteractionListener(mapCreateTester, mapCreateHandler);
	registerInteractionListener(mapAuraTester, mapAuraHandler);
	registerInteractionListener(mapTerrainTester, mapTerrainHandler);
	registerInteractionListener(mapTokenTester, mapTokenHandler);
	registerMessageListener(mapImportTester, mapImportHandler);
	registerCommandRegex(/^map(-|\s+)move(\s*\[(\b(\s|nw|n|ne|w|e|sw|s|se))+\])+\s*$/i, mapMoveHandler);
}

//#region interaction listener testers

type TActionData = { gameMap:GameMap; mapAction:TMapAction; };

/** Returns action data (mapCore and mapAction) or undefined */
async function actionTester(sageInteraction: SageInteraction): Promise<TActionData | undefined> {
	// const [mapId, mapAction] = (sageInteration.interaction.customId ?? "").split("|") as [Discord.Snowflake, TMapAction];
	const mapAction = (sageInteraction.interaction.customId ?? "").split("|")[1] as TMapAction;
	const messageId = sageInteraction.interaction.message?.id;
	if (MapActions.includes(mapAction) && messageId && GameMap.exists(messageId)) {
		const userDid = sageInteraction.user?.id;
		const gameMap = userDid ? await GameMap.forUser(messageId, sageInteraction.user.id, true) : null;
		if (gameMap) {
			return { gameMap, mapAction };
		}
	}
	return undefined;
}

// function mapCreateTester(sageInteraction: SageInteraction): boolean {
// 	return !!sageInteraction.interaction.channel
// 		&& sageInteraction.isCommand("map", "create");
// }

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
// async function mapCreateHandler(sageInteraction: SageInteraction): Promise<void> {
// 	sageInteraction.reply(`Fetching image and configuring map ...`, true);

// 	const userId = sageInteraction.user.id;

// 	const clip = sageInteraction.getString("clip")?.split(",").map(s => +s);
// 	const spawn = sageInteraction.getString("spawn")?.split(",").map(s => +s) ?? [];

// 	const mapCore: TGameMapCore = {
// 		activeMap: {},
// 		auras: [],
// 		clip: clip as [number, number, number, number],
// 		grid: [sageInteraction.getNumber("cols", true), sageInteraction.getNumber("rows", true)],
// 		id: Discord.SnowflakeUtil.generate(),
// 		messageId: undefined!,
// 		name: sageInteraction.getString("name", true),
// 		spawn: spawn as [number, number],
// 		terrain: [],
// 		tokens: [],
// 		url: sageInteraction.getString("url", true),
// 		userId: userId
// 	};

// 	const success = await renderMap(sageInteraction.interaction.channel as TChannel, new GameMap(mapCore, userId));
// 	if (success) {
// 		return sageInteraction.deleteReply();
// 	}

// 	return sageInteraction.reply(`Sorry, something went wrong.`, true);
// }

async function mapAuraHandler(sageInteraction: SageInteraction): Promise<void> {
	sageInteraction.reply(`Fetching image and adding to map ...`, false);
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

	return sageInteraction.reply(`Sorry, something went wrong.`, false);
}

async function mapTerrainHandler(sageInteraction: SageInteraction): Promise<void> {
	sageInteraction.reply(`Fetching image and adding to map ...`, false);
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

	return sageInteraction.reply(`Sorry, something went wrong.`, false);
}

async function mapTokenHandler(sageInteraction: SageInteraction): Promise<void> {
	sageInteraction.reply(`Fetching image and adding to map ...`, false);
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

	return sageInteraction.reply(`Sorry, something went wrong.`, false);
}

//#endregion

/** reads the interaction's channel's messages to find the map */
async function findGameMap(sageInteraction: SageInteraction<Discord.ButtonInteraction>): Promise<GameMap | null> {
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
			// {
			// 	name: "Create",
			// 	description: "Sets the map for this channel.",
			// 	options: [
			// 		{ name:"url", description:"Url to the map image.", isRequired },
			// 		{ name:"name", description:"What do you call this map?", isRequired },
			// 		{ name:"cols", description:"How many columns on this map?", isNumber, isRequired },
			// 		{ name:"rows", description:"How many rows on this map?", isNumber, isRequired },
			// 		{ name:"spawn", description:"Grid location to spawn new images. Default: 1,1 " },
			// 		{ name:"clip", description:"(Advanced) How to clip map's source image: dx,dY,dW,dH" }
			// 	]
			// },
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

function inputToCompassDirections(sageMessage: SageMessage): TCompassDirection[] {
	const directions: TCompassDirection[] = [];
	const matches = sageMessage.slicedContent.match(/\[(\b(\s|nw|n|ne|w|e|sw|s|se))+\]/ig);
	matches?.forEach(match => {
		directions.push(...match.slice(1, -1).toLowerCase().split(/\s/).filter(s => s) as TCompassDirection[]);
	});
	return directions;
}

async function mapMoveHandler(sageMessage: SageMessage): Promise<void> {
	const directions = inputToCompassDirections(sageMessage);
	const mapUserId = sageMessage.sageUser.did;
	const mapMessageId = sageMessage.message.reference?.messageId;
	const mapExists = mapMessageId && directions.length && GameMap.exists(mapMessageId);
	const gameMap = mapExists ? await GameMap.forUser(mapMessageId, mapUserId, true) : null;
	if (gameMap) {
		ensurePlayerCharacter(sageMessage, gameMap);
		const activeImage = gameMap.activeImage;
		if (!activeImage) {
			await sageMessage.message.reply(`You have no image to move ...`);
			return;
		}
		const moveEmoji = directions.map(dir => `[${dir}]`).join(" ");
		const [bool, promptMsg] = await discordPromptYesNoDeletable(sageMessage, `Move ${activeImage.name} ${moveEmoji} ?`);
		await promptMsg?.delete();
		if (bool === true) {
			const movingMessage = await sageMessage.send(`Moving ${activeImage.name} ${moveEmoji} ...`);
			const moved = gameMap.moveActiveToken(...directions);
			const shuffled = gameMap.activeLayer === LayerType.Token ? gameMap.shuffleActiveToken("top") : false;
			const updated = (moved || shuffled)
				&& await renderMap(await sageMessage.message.fetchReference() as Discord.Message, gameMap);
			if (updated) {
				for (const msg of movingMessage) await msg.delete();
				await sageMessage.reactSuccess();
				return;
			}
			await sageMessage.message.reply(`Error moving image ...`);
		}else {
			await sageMessage.reactFailure();
		}
	}
}
