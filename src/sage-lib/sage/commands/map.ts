import { registerMapActivate } from "./map/mapActiveHandler.js";
import { registerMapButtons } from "./map/mapButtonHandler.js";
import { registerMapImport } from "./map/mapImportHandler.js";
import { registerMapMove } from "./map/mapMoveHandler.js";

export function registerMap(): void {
	registerMapActivate();
	registerMapButtons();
	registerMapImport();
	registerMapMove();
	// registerInteractionListener(mapCreateTester, mapCreateHandler);
	// registerInteractionListener(mapAuraTester, mapAuraHandler);
	// registerInteractionListener(mapTerrainTester, mapTerrainHandler);
	// registerInteractionListener(mapTokenTester, mapTokenHandler);
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
