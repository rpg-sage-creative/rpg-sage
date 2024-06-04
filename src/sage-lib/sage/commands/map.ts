import { errorReturnNull } from "@rsc-utils/console-utils";
import type { DMessageChannel } from "@rsc-utils/discord-utils";
import { getText } from "@rsc-utils/https-utils";
import { randomSnowflake } from "@rsc-utils/snowflake-utils";
import { StringMatcher } from "@rsc-utils/string-utils";
import type { Optional } from "@rsc-utils/type-utils";
import { Message, MessageActionRow, MessageButton, type MessageAttachment, type MessageButtonStyleResolvable } from "discord.js";
import { deleteMessage } from "../../discord/deletedMessages.js";
import { registerInteractionListener, registerMessageListener } from "../../discord/handlers.js";
import { TCommandAndArgsAndData } from "../../discord/index.js";
import { discordPromptYesNo } from "../../discord/prompts.js";
import { ReplyStack } from "../model/ReplyStack.js";
import type { SageInteraction } from "../model/SageInteraction.js";
import type { SageMessage } from "../model/SageMessage.js";
import { includeDeleteButton } from "../model/utils/deleteButton.js";
import { registerCommandRegex } from "./cmd.js";
import { GameMap, TCompassDirection, TMoveDirection } from "./map/GameMap.js";
import { LayerType, TGameMapCore } from "./map/GameMapBase.js";
import { TParsedGameMapCore, gameMapImporter, validateMapCore } from "./map/gameMapImporter.js";

//#region buttons

type TMapAction = "MapUpLeft"   | "MapUp"     | "MapUpRight"   | "MapTerrain" | "MapRaise"
				| "MapLeft"     | "MapConfig" | "MapRight"     | "MapAura"    | "MapDelete"
				| "MapDownLeft" | "MapDown"   | "MapDownRight" | "MapToken"   | "MapLower";

	const MapActions = "MapUpLeft,MapUp,MapUpRight,MapTerrain,MapRaise,MapLeft,MapConfig,MapRight,MapAura,MapDelete,MapDownLeft,MapDown,MapDownRight,MapToken,MapLower".split(",");
	const MapActionEmojis = "↖️,⬆️,↗️,⛰️,🔼,⬅️,⚙️,➡️,🟡,❌,↙️,⬇️,↘️,👤,🔽".split(",");

function createButton(gameMap: GameMap, label: string, style: MessageButtonStyleResolvable): MessageButton {
	const button = new MessageButton();
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

function createButtonRow(gameMap: GameMap, ...labels: TMapAction[]): MessageActionRow {
	const actionRow = new MessageActionRow();
	labels.forEach(label => actionRow.addComponents(createButton(gameMap, label, "SECONDARY")));
	return actionRow;
}

function createMapComponents(gameMap: GameMap): MessageActionRow[] {
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

/**
 * Assists in comparing discord attachment image urls.
 * Removes querystring from links grabbed from the web (usually width/height).
 * Changes media.discordapp.net to cdn.discordapp.com.
 */
function simplifyDiscordAttachmentUrl(url: string): string {
	// app https://cdn.discordapp.com/attachments/1140421024777781340/1141450682545745930/opal.png
	// web https://media.discordapp.net/attachments/1140421024777781340/1141450682545745930/opal.png?width=211&height=211
	const appPrefix = "https://cdn.discordapp.com";
	const webPrefix = "https://media.discordapp.net";
	if (url.startsWith(webPrefix)) {
		const endIndex = url.includes("?") ? url.indexOf("?") : undefined;
		return appPrefix + url.slice(webPrefix.length, endIndex);
	}
	return url;
}

/** Compares urls only after simplifying them (if they are discord attachment urls from the web). */
function urlsMatch(a: string, b: string | undefined): boolean {
	return a && b ? simplifyDiscordAttachmentUrl(a) === simplifyDiscordAttachmentUrl(b) : false;
}

/** Compares names by cleaning up the text. */
function namesMatch(a: string, b: string | undefined): boolean {
	return a && b ? StringMatcher.matches(a, b) : false;
}



/** If the user is a player in a game, this will ensure their tokens (pc/companions) are on the map */
function ensurePlayerCharacter(sageCommand: SageInteraction | SageMessage, gameMap: GameMap, stack: ReplyStack): boolean {
	if (sageCommand.isGameMaster) {
		return false;
	}
	const pc = sageCommand.playerCharacter;
	if (!pc) {
		return false;
	}
	let updated = false;
	[pc].concat(pc.companions).forEach(char => {
		const { tokenUrl, avatarUrl } = char;
		const charUrl = tokenUrl ?? avatarUrl;
		if (charUrl) {
			const charName = char.name;
			const charAlias = char.alias;
			const found = gameMap.tokens.find(token => token.characterId === char.id)
				?? gameMap.tokens.find(token => namesMatch(token.name, charName) || namesMatch(token.name, charAlias))
				?? gameMap.tokens.find(token => urlsMatch(token.url, tokenUrl) || urlsMatch(token.url, avatarUrl));
			if (!found) {
				stack.editReply(`Adding token for ${charName} ... ${ReplyStack.SpinnerEmoji}`);
				gameMap.tokens.push({
					auras: [],
					characterId: char.id,
					id: randomSnowflake(),
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
					stack.editReply(`Updating token for ${charName} ... ${ReplyStack.SpinnerEmoji}`);
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
	const stack = new ReplyStack(sageInteraction);
	const toggled = gameMap.cycleActiveTerrain();
	const activeTerrain = gameMap.activeTerrain;
	stack.reply(`Setting ${activeTerrain?.name} as active ... ${ReplyStack.SpinnerEmoji}`);
	const updated = toggled && await gameMap.save();
	if (updated) {
		return stack.editReply(`Your active terrain is: ${activeTerrain?.name ?? "Unknown"}`);
	}
	return stack.deleteReply();
}

async function actionHandlerMapAura(sageInteraction: SageInteraction, gameMap: GameMap): Promise<void> {
	const stack = new ReplyStack(sageInteraction);
	const activeToken = gameMap.activeToken;
	let updated = ensurePlayerCharacter(sageInteraction, gameMap, stack);
	const toggled = gameMap.cycleActiveAura();
	const toggledAura = gameMap.activeAura;
	stack.editReply(`Setting active aura for ${activeToken?.name} to ${toggledAura?.name ?? "none"} ... ${ReplyStack.SpinnerEmoji}`);
	updated = toggled
		&& await renderMap(sageInteraction.interaction.message as Message, gameMap);
	if (updated) {
		return stack.editReply(`Your active aura for ${activeToken?.name} is: ${toggledAura?.name ?? "none"}`);
	}
	return stack.deleteReply();
}

async function actionHandlerMapToken(sageInteraction: SageInteraction, gameMap: GameMap): Promise<void> {
	const stack = new ReplyStack(sageInteraction);
	const added = ensurePlayerCharacter(sageInteraction, gameMap, stack);
	const toggled = gameMap.cycleActiveToken();
	const activeToken = gameMap.activeToken;
	stack.editReply(`Setting ${activeToken?.name} as active ... ${ReplyStack.SpinnerEmoji}`);
	let updated = false;
	if (added) {
		updated = await renderMap(sageInteraction.interaction.message as Message, gameMap);
	}else {
		updated = toggled && await gameMap.save();
	}
	if (updated) {
		return stack.editReply(`Your active token is: ${activeToken?.name ?? "Unknown"}`);
	}
	return stack.deleteReply();
}

async function actionHandlerMapRaise(sageInteraction: SageInteraction, gameMap: GameMap): Promise<void> {
	if (!gameMap.isOwner) {
		return sageInteraction.reply(`You can't edit somebody else's map!`, true);
	}
	const stack = new ReplyStack(sageInteraction);
	let updated = false;
	let output = "";
	switch(gameMap.activeLayer) {
		case LayerType.Aura:
			updated = gameMap.shiftOpacity("up");
			stack.editReply(`Increasing Aura Opacity: ${gameMap.activeAura?.name ?? "Unknown"} ... ${ReplyStack.SpinnerEmoji}`);
			output = `Aura Opacity Increased: ${gameMap.activeAura?.name ?? "Unknown"}`;
			break;
		case LayerType.Terrain:
			updated = gameMap.shuffleActiveTerrain("up");
			stack.editReply(`Raising Terrain: ${gameMap.activeTerrain?.name ?? "Unknown"} ... ${ReplyStack.SpinnerEmoji}`);
			output = `Terrain Raised: ${gameMap.activeTerrain?.name ?? "Unknown"}`;
			break;
		case LayerType.Token:
		default:
			updated = gameMap.shuffleActiveToken("up");
			stack.editReply(`Raising Token: ${gameMap.activeToken?.name ?? "Unknown"} ... ${ReplyStack.SpinnerEmoji}`);
			output = `Token Raised: ${gameMap.activeToken?.name ?? "Unknown"}`;
			break;
	}
	if (updated) {
		updated = await renderMap(sageInteraction.interaction.message as Message, gameMap);
	}
	if (updated) {
		return stack.editReply(output);
	}
	return stack.deleteReply();
}

async function actionHandlerMapLower(sageInteraction: SageInteraction, gameMap: GameMap): Promise<void> {
	if (!gameMap.isOwner) {
		return sageInteraction.reply(`You can't edit somebody else's map!`, true);
	}
	const stack = new ReplyStack(sageInteraction);
	let updated = false;
	let output = "";
	switch(gameMap.activeLayer) {
		case LayerType.Aura:
			updated = gameMap.shiftOpacity("down");
			stack.editReply(`Decreasing Aura Opacity: ${gameMap.activeAura?.name ?? "Unknown"} ... ${ReplyStack.SpinnerEmoji}`);
			output = `Aura Opacity Decreased: ${gameMap.activeAura?.name ?? "Unknown"}`;
			break;
		case LayerType.Terrain:
			updated = gameMap.shuffleActiveTerrain("down");
			stack.editReply(`Lowering Terain: ${gameMap.activeTerrain?.name ?? "Unknown"} ... ${ReplyStack.SpinnerEmoji}`);
			output = `Terrain Lowered: ${gameMap.activeTerrain?.name ?? "Unknown"}`;
			break;
		case LayerType.Token:
		default:
			updated = gameMap.shuffleActiveToken("down");
			stack.editReply(`Lowering Token: ${gameMap.activeToken?.name ?? "Unknown"} ... ${ReplyStack.SpinnerEmoji}`);
			output = `Token Lowered: ${gameMap.activeToken?.name ?? "Unknown"}`;
			break;
	}
	if (updated) {
		updated = await renderMap(sageInteraction.interaction.message as Message, gameMap);
	}
	if (updated) {
		return stack.editReply(output);
	}
	return stack.deleteReply();
}

async function actionHandlerMapConfig(sageInteraction: SageInteraction, _: GameMap): Promise<void> {
	return sageInteraction.reply(`Not Implemented ... Yet.`, true);
}

async function actionHandlerMapDelete(sageInteraction: SageInteraction, gameMap: GameMap): Promise<void> {
	const activeImage = gameMap.activeImage;
	if (activeImage) {
		const stack = new ReplyStack(sageInteraction);
		stack.defer();
		const boolDelete = await discordPromptYesNo(sageInteraction, `Delete image: ${activeImage.name}?`, true);
		if (boolDelete) {
			stack.editReply(`Deleting image: ${activeImage.name} ... ${ReplyStack.SpinnerEmoji}`);
			const deleted = gameMap.deleteImage(activeImage);
			const updated = deleted
				&& await renderMap(sageInteraction.interaction.message as Message, gameMap);
			if (updated) {
				return stack.editReply(`Deleted image: ${activeImage.name}`);
			}
			return stack.editReply(`Error deleting image!`);
		}
		return stack.deleteReply();
	}else {
		return sageInteraction.reply(`You have no image to delete!`, true);
	}
}

async function actionHandlerMapMove(sageInteraction: SageInteraction, actionData: TActionData): Promise<void> {
	const stack = new ReplyStack(sageInteraction);
	const gameMap = actionData.gameMap;
	let updated = ensurePlayerCharacter(sageInteraction, gameMap, stack);
	const activeImage = gameMap.activeImage;
	const mapAction = actionData.mapAction;
	if (activeImage) {
		stack.editReply(`Moving ${activeImage.name} ${toDirection(mapAction)} ... ${ReplyStack.SpinnerEmoji}`);
		const moved = gameMap.moveActiveToken(mapAction.slice(3).toLowerCase() as TMoveDirection);
		const shuffled = gameMap.activeLayer === LayerType.Token ? gameMap.shuffleActiveToken("top") : false;
		updated = (moved || shuffled)
			&& await renderMap(sageInteraction.interaction.message as Message, gameMap);
		if (updated) {
			return stack.deleteReply();
		}
		return stack.editReply(`Error moving image!`);
	}
	return sageInteraction.reply(`You have no image to move!`, true);
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

function getValidUrl(attachment: MessageAttachment): string | null {
	const regex = /map\.txt$/i;
	if (regex.test(attachment.url.split("?")[0])) {
		return attachment.url;
	}
	if (regex.test(attachment.proxyURL.split("?")[0])) {
		return attachment.proxyURL;
	}
	if (attachment.name && regex.test(attachment.name)) {
		return attachment.attachment.toString();
	}
	return null;
}

async function mapImportTester(sageMessage: SageMessage): Promise<TCommandAndArgsAndData<TParsedGameMapCore> | null> {
	// not doing maps in DMs
	if (!sageMessage.caches.discord.guild) return null;

	const attachments = sageMessage.message.attachments;
	if (!attachments.size) {
		return null;
	}

	for (const [_id, attachment] of attachments) {
		const validUrl = getValidUrl(attachment);
		if (validUrl) {
			const raw = await getText(validUrl);
			const parsedCore = gameMapImporter(raw);
			if (parsedCore) {
				return {
					data: parsedCore
				};
			}
		}
	}
	return null;
}

async function mapImportHandler(sageMessage: SageMessage, mapCore: TGameMapCore | TParsedGameMapCore): Promise<void> {
	const boolImport = await discordPromptYesNo(sageMessage, `Try to import map: ${mapCore.name}?`, true);
	if (boolImport) {
		const channel = sageMessage.message.channel;
		const pwConfiguring = await channel.send(`Importing and configuring: ${mapCore.name} ... ${ReplyStack.SpinnerEmoji}`);

		const validatedCore = await validateMapCore(mapCore as TParsedGameMapCore, sageMessage.message.guild!);
		const invalidUsers = validatedCore.invalidUsers ?? [];
		const invalidImages = validatedCore.invalidImages ?? [];
		if (invalidUsers.length || invalidImages.length) {
			const warning = `### Warning\nThe map cannot be loaded for the following reasons ...`;
			const invalidUserText = invalidUsers.length ? `\n### Invalid Users\nThe following users could not be found:\n> ${invalidUsers.join("\n> ")}` : ``;
			const invalidImageText = invalidImages.length ? `\n### Invalid Images\nThe following images could not be loaded:\n> ${invalidImages.map(url => `<${url}>`).join("\n> ")}` : ``;
			await channel.send(warning + invalidUserText + invalidImageText);

		}else {
			if (!mapCore.userId) {
				mapCore.userId = sageMessage.sageUser.did;
			}
			const success = await renderMap(channel, new GameMap(mapCore as TGameMapCore, mapCore.userId));
			if (!success) {
				await channel.send(`Sorry, something went wrong importing the map.`);
			}
		}

		deleteMessage(pwConfiguring);
	}
}

//#endregion

export function registerMap(): void {
	registerInteractionListener(actionTester, actionHandler);
	// registerInteractionListener(mapCreateTester, mapCreateHandler);
	// registerInteractionListener(mapAuraTester, mapAuraHandler);
	// registerInteractionListener(mapTerrainTester, mapTerrainHandler);
	// registerInteractionListener(mapTokenTester, mapTokenHandler);
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

// function mapAuraTester(sageInteraction: SageInteraction): boolean {
// 	return !!sageInteraction.interaction.channel
// 		&& sageInteraction.isCommand("Map", "AddImage")
// 		&& sageInteraction.args.hasString("layer", "aura");
// }

// function mapTerrainTester(sageInteraction: SageInteraction): boolean {
// 	return !!sageInteraction.interaction.channel
// 		&& sageInteraction.isCommand("Map", "AddImage")
// 		&& sageInteraction.args.hasString("layer", "terrain");
// }

// function mapTokenTester(sageInteraction: SageInteraction): boolean {
// 	return !!sageInteraction.interaction.channel
// 		&& sageInteraction.isCommand("Map", "AddImage")
// 		&& sageInteraction.args.hasString("layer", "token");
// }

//#endregion

//#region interaction listener handlers

/** creates a new map from the interaction */
// async function mapCreateHandler(sageInteraction: SageInteraction): Promise<void> {
// 	sageInteraction.reply(`Fetching image and configuring map ... ${ReplyStack.SpinnerEmoji}`, true);

// 	const userId = sageInteraction.user.id;

// 	const clip = sageInteraction.getString("clip")?.split(",").map(s => +s);
// 	const spawn = sageInteraction.getString("spawn")?.split(",").map(s => +s) ?? [];

// 	const mapCore: TGameMapCore = {
// 		activeMap: {},
// 		auras: [],
// 		clip: clip as [number, number, number, number],
// 		grid: [sageInteraction.getNumber("cols", true), sageInteraction.getNumber("rows", true)],
// 		id: randomSnowflake(),
// 		messageId: undefined!,
// 		name: sageInteraction.getString("name", true),
// 		spawn: spawn as [number, number],
// 		terrain: [],
// 		tokens: [],
// 		url: sageInteraction.getString("url", true),
// 		userId: userId
// 	};

// 	const success = await renderMap(sageInteraction.interaction.channel as DMessageChannel, new GameMap(mapCore, userId));
// 	if (success) {
// 		return sageInteraction.deleteReply();
// 	}

// 	return sageInteraction.reply(`Sorry, something went wrong.`, true);
// }

// async function mapAuraHandler(sageInteraction: SageInteraction): Promise<void> {
// 	const stack = new ReplyStack(sageInteraction);
// 	stack.reply(`Fetching image and adding to map ... ${ReplyStack.SpinnerEmoji}`);
// 	const [gameMap, aura] = await parseInput<TGameMapAura>(sageInteraction);
// 	if (!gameMap || !aura) {
// 		return stack.editReply("Sorry, no aura found!");
// 	}

// 	aura.opacity = 0.5;

// 	const anchorName = sageInteraction.args.getString("anchor");
// 	const matcher = new StringMatcher(anchorName);
// 	const anchor = gameMap.userTokens.find(token => matcher.matches(token.name));
// 	if (anchor) {
// 		aura.anchorId = anchor.id;
// 		anchor.auras.push(aura);
// 		anchor.auraId = aura.id;
// 		gameMap.activeImage = anchor;
// 	}else {
// 		gameMap.auras.push(aura);
// 		gameMap.activeImage = aura;
// 	}

// 	const message = await sageInteraction.interaction.channel?.messages.fetch(gameMap.messageId);
// 	const success = await renderMap(message, gameMap);

// 	if (success) {
// 		return sageInteraction.deleteReply();
// 	}

// 	return stack.editReply(`Sorry, something went wrong.`);
// }

// async function mapTerrainHandler(sageInteraction: SageInteraction): Promise<void> {
// 	sageInteraction.reply(`Fetching image and adding to map ...`, false);
// 	const [gameMap, terrain] = await parseInput<TGameMapTerrain>(sageInteraction);
// 	if (!gameMap || !terrain) {
// 		return Promise.resolve();
// 	}

// 	gameMap.terrain.push(terrain);
// 	gameMap.activeImage = terrain;

// 	const message = await sageInteraction.interaction.channel?.messages.fetch(gameMap.messageId);
// 	const success = await renderMap(message, gameMap);

// 	if (success) {
// 		return sageInteraction.deleteReply();
// 	}

// 	return sageInteraction.reply(`Sorry, something went wrong.`, false);
// }

// async function mapTokenHandler(sageInteraction: SageInteraction): Promise<void> {
// 	sageInteraction.reply(`Fetching image and adding to map ...`, false);
// 	const [gameMap, token] = await parseInput<TGameMapToken>(sageInteraction);
// 	if (!gameMap || !token) {
// 		return Promise.resolve();
// 	}

// 	gameMap.tokens.push(token);
// 	gameMap.activeImage = token;

// 	const message = await sageInteraction.interaction.channel?.messages.fetch(gameMap.messageId);
// 	const success = await renderMap(message, gameMap);

// 	if (success) {
// 		return sageInteraction.deleteReply();
// 	}

// 	return sageInteraction.reply(`Sorry, something went wrong.`, false);
// }

//#endregion

/** reads the interaction's channel's messages to find the map */
// async function findGameMap(sageInteraction: SageInteraction<ButtonInteraction>): Promise<GameMap | null> {
// 	const mapValue = sageInteraction.args.getString("map")!;
// 	if (isNonNilSnowflake(mapValue)) {
// 		return GameMap.forUser(mapValue, sageInteraction.user.id);
// 	}
// 	const messages = await sageInteraction.interaction.channel?.messages.fetch();
// 	if (!messages) {
// 		return null;
// 	}
// 	let messageId: Snowflake | undefined;
// 	messages.find(msg => {
// 		if (msg.attachments.size && msg.components.length && GameMap.matches(msg.id, mapValue)) {
// 			messageId = msg.id;
// 			return true;
// 		}
// 		return false;
// 	});
// 	return messageId
// 		? GameMap.forUser(messageId, sageInteraction.user.id)
// 		: null;
// }

// async function parseInput<T extends TGameMapImage>(sageInteraction: SageInteraction): Promise<[GameMap | null, T | null]> {
// 	const gameMap = await findGameMap(sageInteraction);
// 	if (!gameMap) {
// 		await sageInteraction.reply("Invalid Map!", true);
// 		return [null, null];
// 	}

// 	const layerValue = capitalize(sageInteraction.args.getString("layer")) as "Aura" | "Terrain" | "Token";

// 	const image: TGameMapImage = {
// 		auras: [],
// 		id: randomSnowflake(),
// 		layer: LayerType[layerValue],
// 		name: sageInteraction.args.getString("name")!,
// 		pos: [
// 			sageInteraction.args.getNumber("col") ?? gameMap.spawn[COL],
// 			sageInteraction.args.getNumber("row") ?? gameMap.spawn[ROW]
// 		],
// 		size: [
// 			sageInteraction.args.getNumber("cols") ?? 1,
// 			sageInteraction.args.getNumber("rows") ?? 1
// 		],
// 		url: sageInteraction.args.getString("url")!,
// 		userId: sageInteraction.user.id
// 	};

// 	return [gameMap, image as T];
// }

async function renderMap(messageOrChannel: Optional<Message | DMessageChannel>, gameMap: GameMap): Promise<boolean> {
	if (!messageOrChannel) {
		return false;
	}
	const buffer = await gameMap.toRenderable().render();
	if (buffer) {
		const content = `**${gameMap.name}**`;
		const files = [buffer];
		const components = createMapComponents(gameMap);
		const message = messageOrChannel instanceof Message
			? await messageOrChannel.edit({ content, files, components }).catch(errorReturnNull)
			: await messageOrChannel.send({ content, files, components }).catch(errorReturnNull);
		if (message) {
			gameMap.messageId = message.id;
			return gameMap.save();
		}
	}
	return false;
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
	const mapUserId = sageMessage.sageUser.did;

	const mapMessageId = sageMessage.message.reference?.messageId;
	const mapExists = mapMessageId && GameMap.exists(mapMessageId);
	if (!mapExists) {
		return sageMessage.reply(includeDeleteButton({ content:`Please reply to the map you wish to move your token on.` }, mapUserId));
	}

	const directions = inputToCompassDirections(sageMessage);
	const gameMap = mapExists ? await GameMap.forUser(mapMessageId, mapUserId, true) : null;
	if (gameMap) {
		const stack = new ReplyStack(sageMessage);
		ensurePlayerCharacter(sageMessage, gameMap, stack);
		const activeImage = gameMap.activeImage;
		if (!activeImage) {
			return stack.editReply(`You have no image to move!`);
		}
		const moveEmoji = directions.map(dir => `[${dir}]`).join(" ");
		const boolMove = await discordPromptYesNo(sageMessage, `Move ${activeImage.name} ${moveEmoji} ?`, true);
		if (boolMove === true) {
			stack.editReply(`Moving ${activeImage.name} ${moveEmoji} ... ${ReplyStack.SpinnerEmoji}`);
			const moved = gameMap.moveActiveToken(...directions);
			const shuffled = gameMap.activeLayer === LayerType.Token ? gameMap.shuffleActiveToken("top") : false;
			const updated = (moved || shuffled)
				&& await renderMap(await sageMessage.message.fetchReference(), gameMap);
			if (!updated) {
				return stack.editReply(`Error moving image!`);
			}
		}
		return stack.deleteReply();
	}
}
