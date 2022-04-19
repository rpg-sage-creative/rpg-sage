import * as Discord from "discord.js";
import utils, { Optional, VALID_UUID, type UUID } from "../../../sage-utils";
import { registerSlashCommand } from "../../../slash.mjs";
import type { TSlashCommand } from "../../../types";
import type { TChannel } from "../../discord";
import { registerInteractionListener } from "../../discord/handlers";
import type SageInteraction from "../model/SageInteraction";

type TMapImage = {
	/** unique identifier */
	id: VALID_UUID;
	/** name of the token */
	name: string;
	/** position on the map: [col, row] */
	pos: [number, number];
	/** token size: [cols, rows] */
	size: [number, number];
	/** url to the image */
	url: string;
};

type TMapToken = TMapImage & {
	/** indicates if this token is the active token for its user */
	active: boolean;
	/** the owner of the token */
	user: Discord.Snowflake;
};

type TMapAura = TMapToken & {
	/** id of another token to anchor this one to */
	anchor?: VALID_UUID;
	/** opacity of the token; primarily for auras */
	opacity?: number;
};

type TMapTerrain = TMapImage;

type TMapCore = {
	/** images that should go on the aura layer: above the terrain layer, below the token layer */
	auras: TMapAura[];
	/** image clip rectangle: [xOffset, yOffset, width, height] */
	clip?: [number, number, number, number];
	/** grid dimensions: [cols, rows] */
	grid: [number, number];
	/** unique identifier */
	id: VALID_UUID;
	/** the message this map is posted in */
	messageDid: Discord.Snowflake;
	/** name of the map */
	name: string;
	/** where tokens first appear: [col, row] */
	spawn?: [number, number];
	/** images that should go on the terrain layer: the bottom layer */
	terrain: TMapTerrain[];
	/** images that should go on the token layer: the top layer */
	tokens: TMapToken[];
	/** url to the image */
	url: string;
};

//#region read/write mapCore

function getMapFilePath(mapIdOrMessageDid: UUID | Discord.Snowflake): string {
	return `./data/sage/maps/${mapIdOrMessageDid}.json`;
}

function isValidMap(mapIdOrMessageDid: UUID | Discord.Snowflake): boolean {
	return utils.FsUtils.fileExistsSync(getMapFilePath(mapIdOrMessageDid));
}

function readMapCore(mapIdOrMessageDid: VALID_UUID | Discord.Snowflake): Promise<TMapCore | null> {
	return utils.FsUtils.readJsonFile<TMapCore>(getMapFilePath(mapIdOrMessageDid))
		.catch(utils.ConsoleUtils.Catchers.errorReturnNull);
}

async function writeMapCore(mapCore: TMapCore): Promise<boolean> {
	const pMapId = utils.FsUtils.writeFile(getMapFilePath(mapCore.id), mapCore, true)
		.catch(utils.ConsoleUtils.Catchers.errorReturnFalse);
	const pMessageId = utils.FsUtils.writeFile(getMapFilePath(mapCore.messageDid), mapCore, true)
		.catch(utils.ConsoleUtils.Catchers.errorReturnFalse);
	return Promise.all([pMapId, pMessageId])
		.then(([bMapId, bMessageId]) => bMapId && bMessageId);
}

//#endregion

//#region buttons

type TMapAction = "MapUpLeft"   | "MapUp"     | "MapUpRight"
	             | "MapLeft"     | "MapConfig" | "MapRight"
	             | "MapDownLeft" | "MapDown"   | "MapDownRight";

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

function createButtonRow(mapId: UUID, ...labels: TMapAction[]): Discord.MessageActionRow {
	const actionRow = new Discord.MessageActionRow();
	labels.forEach(label => actionRow.addComponents(createButton(`${mapId}|${label}`, label, "SECONDARY")));
	return actionRow;
}

function createMapButtons(mapId: UUID): Discord.MessageActionRow[] {
	return [
		createButtonRow(mapId, "MapUpLeft", "MapUp", "MapUpRight"),
		createButtonRow(mapId, "MapLeft", "MapConfig", "MapRight"),
		createButtonRow(mapId, "MapDownLeft", "MapDown", "MapDownRight")
	];
}

const MapActions = "MapUpLeft,MapUp,MapUpRight,MapLeft,MapConfig,MapRight,MapDownLeft,MapDown,MapDownRight".split(",");
const MapActionEmojis = "↖️,⬆️,↗️,⬅️,⚙️,➡️,↙️,⬇️,↘️".split(",");

//#endregion

function isTokenUser(mapCore: Optional<TMapCore>, userDid: Discord.Snowflake): mapCore is TMapCore {
	return mapCore?.tokens?.find(token => token.user === userDid) !== undefined;
}

type TActionData = { mapCore:TMapCore; mapAction:TMapAction; };

function parseCustomId(sageInteration: SageInteraction): [mapId: UUID, mapAction: TMapAction] {
	const parts = (sageInteration.interaction.customId ?? "").split("|");
	return [parts[0], parts[1] as TMapAction];
}

async function actionTester(sageInteration: SageInteraction): Promise<TActionData | false> {
	const [mapId, mapAction] = parseCustomId(sageInteration);
	if (MapActions.includes(mapAction) && isValidMap(mapId)) {
		const mapCore = await readMapCore(mapId);
		if (isTokenUser(mapCore, sageInteration.user.id)) {
			return { mapCore, mapAction };
		}
	}
	return false;
}

//#region token movement
function up(token: TMapToken, min = 0): boolean {
	if (token.pos[1] === min) {
		return false;
	}
	token.pos[1]--;
	return true;
}
function down(token: TMapToken, max: number): boolean {
	if (token.pos[1] === max) {
		return false;
	}
	token.pos[1]++;
	return true;
}
function left(token: TMapToken, min = 0): boolean {
	if (token.pos[0] === min) {
		return false;
	}
	token.pos[0]--;
	return true;
}
function right(token: TMapToken, max: number): boolean {
	if (token.pos[0] === max) {
		return false;
	}
	token.pos[0]++;
	return true;
}
/** convenience method so i can call two functions in a single line and return the /or/ of the results */
function or(a: boolean, b: boolean): boolean {
	return a || b;
}
function moveToken(token: TMapToken, action: TMapAction, maxValues: [number, number]): boolean {
	switch(action) {
		case "MapUpLeft": return or(up(token), left(token));
		case "MapUp": return up(token);
		case "MapUpRight": return or(up(token), right(token, maxValues[0]));
		case "MapLeft": return left(token);
		case "MapRight": return right(token, maxValues[0]);
		case "MapDownLeft": return or(down(token, maxValues[1]), left(token));
		case "MapDown": return down(token, maxValues[1]);
		case "MapDownRight": return or(down(token, maxValues[1]), right(token, maxValues[0]));
		default: return false;
	}
}

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


function getActiveToken(mapCore: TMapCore, userDid: Discord.Snowflake): TMapToken | undefined {
	const userTokens = mapCore.tokens.filter(token => token.user === userDid);
	return userTokens.find(token => token.active) ?? userTokens[0];
}

function shuffleToken(mapCore: TMapCore, userDid: Discord.Snowflake, where: "top" | "bottom" | "up" | "down"): boolean {
	const token = getActiveToken(mapCore, userDid);
	if (!token) {
		return false;
	}
	const index = mapCore.tokens.indexOf(token);
	switch(where) {
		case "top":
			mapCore.tokens = mapCore.tokens.filter(t => t !== token).concat([token]);
			break;
		case "bottom":
			mapCore.tokens = [token].concat(mapCore.tokens.filter(t => t !== token));
			break;
		case "up":
			if (mapCore.tokens.slice().pop() !== token) {
				const newIndex = index + 1;
				mapCore.tokens = mapCore.tokens.filter(t => t !== token);
				mapCore.tokens.splice(newIndex, 0, token);
			}
			break;
		case "down":
			if (mapCore.tokens[0] === token) {
				const newIndex = index - 1;
				mapCore.tokens = mapCore.tokens.filter(t => t !== token);
				mapCore.tokens.splice(newIndex, 0, token);
			}
			break;
	}
	return index !== mapCore.tokens.indexOf(token);
}

function toggleActiveToken(mapCore: TMapCore, userDid: Discord.Snowflake): boolean {
	const userTokens = mapCore.tokens.filter(token => token.user === userDid);
	if (userTokens.length < 2) {
		return false;
	}
	const prev = getActiveToken(mapCore, userDid)!;
	const index = userTokens.indexOf(prev);
	const next = userTokens[index + 1] ?? userTokens[0]!;
	prev.active = false;
	next.active = true;
	return true;
}
//#endregion

async function actionHandler(sageInteraction: SageInteraction, actionData: TActionData): Promise<void> {
	const mapCore = actionData.mapCore;
	const userDid = sageInteraction.user.id;
	const activeToken = getActiveToken(mapCore, userDid);
	const mapAction = actionData.mapAction;
	let updated = false;
	if (mapAction === "MapConfig") {
		const toggled = toggleActiveToken(mapCore, userDid);
		sageInteraction.reply(`Setting ${getActiveToken(mapCore, userDid)?.name} as active ...`, true);
		updated = or(toggled, shuffleToken(mapCore, userDid, "top"))
			&& await renderMap(sageInteraction.interaction.message as Discord.Message, mapCore);
		if (updated) {
			return sageInteraction.reply(`Your active token is: ${getActiveToken(mapCore, userDid)?.name ?? "Unknown"}`, true);
		}
	}else if (activeToken) {
		sageInteraction.reply(`Moving ${activeToken.name} ${toDirection(mapAction)} ...`, false);
		updated = or(moveToken(activeToken, mapAction, [mapCore.grid[0] - 1, mapCore.grid[1] - 1]), shuffleToken(mapCore, userDid, "top"))
			&& await renderMap(sageInteraction.interaction.message as Discord.Message, mapCore);
		if (updated) {
			return sageInteraction.deleteReply();
		}
		return sageInteraction.reply(`Error moving token ...`, false);
	}
	return sageInteraction.deleteReply();
}

export function registerCommandHandlers(): void {
	registerInteractionListener(actionTester, actionHandler);
	registerInteractionListener(mapCreateTester, mapCreateHandler);
	registerInteractionListener(mapAuraTester, mapAuraHandler);
	registerInteractionListener(mapTerrainTester, mapTerrainHandler);
	registerInteractionListener(mapTokenTester, mapTokenHandler);
}

function mapCreateTester(sageInteraction: SageInteraction): boolean {
	return !!sageInteraction.interaction.channel
		&& sageInteraction.isCommand("map", "create");
}
function mapAuraTester(sageInteraction: SageInteraction): boolean {
	return !!sageInteraction.interaction.channel
		&& sageInteraction.isCommand("map", "image")
		&& sageInteraction.getString("layer") === "aura";
}
function mapTerrainTester(sageInteraction: SageInteraction): boolean {
	return !!sageInteraction.interaction.channel
		&& sageInteraction.isCommand("map", "image")
		&& sageInteraction.getString("layer") === "terrain";
}
function mapTokenTester(sageInteraction: SageInteraction): boolean {
	return !!sageInteraction.interaction.channel
		&& sageInteraction.isCommand("map", "image")
		&& sageInteraction.getString("layer") === "token";
}

async function mapCreateHandler(sageInteraction: SageInteraction): Promise<void> {
	sageInteraction.reply(`Fetching image and configuring map ...`, true);

	const clip = sageInteraction.getString("clip")?.split(",").map(s => +s);
	const spawn = sageInteraction.getString("spawn")?.split(",").map(s => +s) ?? [];

	const mapCore: TMapCore = {
		auras: [],
		clip: clip as [number, number, number, number],
		grid: [sageInteraction.getNumber("cols", true), sageInteraction.getNumber("rows", true)],
		id: utils.UuidUtils.generate(),
		messageDid: undefined!,
		name: sageInteraction.getString("name", true),
		spawn: spawn as [number, number],
		terrain: [],
		tokens: [],
		url: sageInteraction.getString("url", true)
	};

	const success = await renderMap(sageInteraction.interaction.channel as TChannel, mapCore);
	if (success) {
		return sageInteraction.deleteReply();
	}

	return sageInteraction.reply(`Sorry, something went wrong.`, true);
}

async function mapAuraHandler(sageInteraction: SageInteraction): Promise<void> {
	sageInteraction.reply(`Fetching image and adding to map ...`, true);
	const mapIdOrMessageDid = sageInteraction.getString("map", true);
	const mapCore = await readMapCore(mapIdOrMessageDid);
	if (!mapCore) {
		return sageInteraction.reply("Invalid Map!", true);
	}

	const anchorName = sageInteraction.getString("anchor");
	const anchor = mapCore.tokens.find(token => utils.StringUtils.StringMatcher.matches(anchorName, token.name));

	const aura: TMapAura = {
		active: true,
		anchor: anchor?.id,
		id: utils.UuidUtils.generate(),
		name: sageInteraction.getString("name", true),
		pos: [sageInteraction.getNumber("col") ?? mapCore.spawn?.[0] ?? 0, sageInteraction.getNumber("row") ?? mapCore.spawn?.[1] ?? 0],
		size: [sageInteraction.getNumber("cols") ?? 1, sageInteraction.getNumber("rows") ?? 1],
		url: sageInteraction.getString("url", true),
		user: sageInteraction.user.id
	};

	mapCore.auras.forEach(_aura => _aura.active =_aura.user === aura.user ? false : _aura.active);
	mapCore.auras.push(aura);

	const message = sageInteraction.interaction.channel?.messages.cache.find(msg => msg.id === mapCore.messageDid);
	const success = await renderMap(message, mapCore);

	if (success) {
		return sageInteraction.deleteReply();
	}

	return sageInteraction.reply(`Sorry, something went wrong.`, true);
}

async function mapTerrainHandler(sageInteraction: SageInteraction): Promise<void> {
	sageInteraction.reply(`Fetching image and adding to map ...`, true);
	const mapIdOrMessageDid = sageInteraction.getString("map", true);
	const mapCore = await readMapCore(mapIdOrMessageDid);
	if (!mapCore) {
		return sageInteraction.reply("Invalid Map!", true);
	}

	const terrain: TMapTerrain = {
		id: utils.UuidUtils.generate(),
		name: sageInteraction.getString("name", true),
		pos: [sageInteraction.getNumber("col") ?? mapCore.spawn?.[0] ?? 0, sageInteraction.getNumber("row") ?? mapCore.spawn?.[1] ?? 0],
		size: [sageInteraction.getNumber("cols") ?? 1, sageInteraction.getNumber("rows") ?? 1],
		url: sageInteraction.getString("url", true)
	};

	mapCore.terrain.push(terrain);

	const message = sageInteraction.interaction.channel?.messages.cache.find(msg => msg.id === mapCore.messageDid);
	const success = await renderMap(message, mapCore);

	if (success) {
		return sageInteraction.deleteReply();
	}

	return sageInteraction.reply(`Sorry, something went wrong.`, true);
}

async function mapTokenHandler(sageInteraction: SageInteraction): Promise<void> {
	sageInteraction.reply(`Fetching image and adding to map ...`, true);
	const mapIdOrMessageDid = sageInteraction.getString("map", true);
	const mapCore = await readMapCore(mapIdOrMessageDid);
	if (!mapCore) {
		return sageInteraction.reply("Invalid Map!", true);
	}

	const token: TMapToken = {
		active: true,
		id: utils.UuidUtils.generate(),
		name: sageInteraction.getString("name", true),
		pos: [sageInteraction.getNumber("col") ?? mapCore.spawn?.[0] ?? 0, sageInteraction.getNumber("row") ?? mapCore.spawn?.[1] ?? 0],
		size: [sageInteraction.getNumber("cols") ?? 1, sageInteraction.getNumber("rows") ?? 1],
		url: sageInteraction.getString("url", true),
		user: sageInteraction.user.id
	};

	mapCore.tokens.forEach(_token => _token.active =_token.user === token.user ? false : _token.active);
	mapCore.tokens.push(token);

	const message = sageInteraction.interaction.channel?.messages.cache.find(msg => msg.id === mapCore.messageDid);
	const success = await renderMap(message, mapCore);

	if (success) {
		return sageInteraction.deleteReply();
	}

	return sageInteraction.reply(`Sorry, something went wrong.`, true);
}

async function renderMap(messageOrChannel: Optional<Discord.Message | TChannel>, mapCore: TMapCore): Promise<boolean> {
	if (!messageOrChannel) {
		return false;
	}
	const buffer = await utils.MapUtils.mapToBuffer(new GameMap(mapCore)).catch(utils.ConsoleUtils.Catchers.errorReturnNull);
	if (buffer) {
		const components = createMapButtons(mapCore.id);
		const message = messageOrChannel instanceof Discord.Message
			? await messageOrChannel.edit({ files:[buffer], components:components }).catch(utils.ConsoleUtils.Catchers.errorReturnNull)
			: await messageOrChannel.send({ files:[buffer], components:components }).catch(utils.ConsoleUtils.Catchers.errorReturnNull);
		if (message) {
			mapCore.messageDid = message.id;
			return writeMapCore(mapCore);
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
					{ name:"rows", description:"How many rows on this map?", isNumber, isRequired }
				]
			},
			{
				name: "AddImage",
				description: "Adds an image to a map",
				options: [
					{ name:"map", description:"Map Id?", isRequired, },
					{ name:"layer", description:"Which map layer?", isRequired, choices:["aura","terrain","token"] },
					{ name:"url", description:"Url to the token image.", isRequired },
					{ name:"name", description:"What/Who is this?", isRequired },
					{ name:"cols", description:"How many columns is this token?", isNumber, isRequired },
					{ name:"rows", description:"How many rows is this token?", isNumber, isRequired },
					{ name:"col", description:"Column to place this image.", isNumber, isRequired },
					{ name:"row", description:"Row to place this image.", isNumber, isRequired }
				]
			}
		]
	};
}

export function registerSlashCommands(): void {
	registerSlashCommand(mapCommand());
}

class GameMapLayer implements utils.MapUtils.IMapLayer {
	public constructor(protected images: TMapImage[]) { }
	public getImages<T extends utils.MapUtils.TMapLayerImage>(): T[] {
		return this.images.map(image => {
			return {
				size: image.size,
				gridOffset: image.pos,
				url: image.url
			} as T;
		});
	}
	public getOffset(): Partial<utils.MapUtils.THasOffset> {
		return { };
	}
}
class GameMap implements utils.MapUtils.IMap {
	public constructor (protected core: TMapCore) { }
	public getBackground(): utils.MapUtils.TMapBackgroundImage {
		return {
			url: this.core.url
		};
	}
	public getGrid(): [number, number] {
		return this.core.grid;
	}
	public getLayers(): GameMapLayer[] {
		return [
			new GameMapLayer(this.core.terrain),
			new GameMapLayer(this.core.auras),
			new GameMapLayer(this.core.tokens)
		];
	}
}