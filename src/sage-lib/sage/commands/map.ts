import * as Discord from "discord.js";
import utils, { Optional, VALID_UUID, type UUID } from "../../../sage-utils";
import { downloadImage, renderMap as mapToBuffer, TMapMeta, TTokenMeta } from "../../../sage-utils/utils/ImageUtils";
import { registerSlashCommand } from "../../../slash.mjs";
import type { TSlashCommand } from "../../../types";
import type { TChannel } from "../../discord";
import { registerInteractionListener } from "../../discord/handlers";
import type SageInteraction from "../model/SageInteraction";

type TMapToken = {
	active: boolean;
	cols: number;
	id: VALID_UUID;
	name: string;
	rows: number;
	url: string;
	user: Discord.Snowflake;
	x: number;
	y: number;
};

type TMapCore = {
	cols: number;
	id: VALID_UUID;
	name: string;
	rows: number;
	tokens: TMapToken[];
	url: string;
};

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

function isTokenUser(mapCore: Optional<TMapCore>, userDid: Discord.Snowflake): mapCore is TMapCore {
	return mapCore?.tokens?.find(token => token.user === userDid) !== undefined;
}

function getTokenFilePath(mapId: UUID, tokenId: VALID_UUID): string {
	return `./data/sage/maps/${mapId}/tokens/${tokenId}.png`;
}

/** Ensures valid UUID *and* existing file. */
function isValidToken(mapId: UUID, tokenId: UUID): tokenId is VALID_UUID {
	return utils.UuidUtils.isValid(tokenId)
		&& utils.FsUtils.fileExistsSync(getTokenFilePath(mapId, tokenId));
}

function getMapFilePath(mapId: VALID_UUID, which: "core" | "original" | "render"): string {
	const suffix = which === "core" ? "" : `-${which}`;
	const ext = which === "core" ? "json" : "png";
	return `./data/sage/maps/${mapId}/${mapId}${suffix}.${ext}`;
}

/** Ensures valid UUID *and* existing file. */
function isValidMap(mapId: UUID): mapId is VALID_UUID {
	return utils.UuidUtils.isValid(mapId)
		&& utils.FsUtils.fileExistsSync(getMapFilePath(mapId, "core"))
		&& utils.FsUtils.fileExistsSync(getMapFilePath(mapId, "original"));
}

function getMapCore(mapId: VALID_UUID): Promise<TMapCore | null> {
	return utils.FsUtils.readJsonFile<TMapCore>(getMapFilePath(mapId, "core"))
		.catch(utils.ConsoleUtils.Catchers.errorReturnNull);
}

type TActionData = { mapCore:TMapCore; mapAction:TMapAction; };

function parseCustomId(sageInteration: SageInteraction): [mapId: UUID, mapAction: TMapAction] {
	const parts = (sageInteration.interaction.customId ?? "").split("|");
	return [parts[0], parts[1] as TMapAction];
}

async function actionTester(sageInteration: SageInteraction): Promise<TActionData | false> {
	const [mapId, mapAction] = parseCustomId(sageInteration);
	if (MapActions.includes(mapAction) && isValidMap(mapId)) {
		const mapCore = await getMapCore(mapId);
		if (isTokenUser(mapCore, sageInteration.user.id)) {
			return { mapCore, mapAction };
		}
	}
	return false;
}

function up(token: TMapToken, min = 0): boolean {
	if (token.y === min) {
		return false;
	}
	token.y--;
	return true;
}
function down(token: TMapToken, max: number): boolean {
	if (token.y === max) {
		return false;
	}
	token.y++;
	return true;
}
function left(token: TMapToken, min = 0): boolean {
	if (token.x === min) {
		return false;
	}
	token.x--;
	return true;
}
function right(token: TMapToken, max: number): boolean {
	if (token.x === max) {
		return false;
	}
	token.x++;
	return true;
}
/** convenience method so i can call two functions in a single line and return the /or/ of the results */
function or(a: boolean, b: boolean): boolean {
	return a || b;
}
type TCoord = { x:number, y:number; };
function moveToken(token: TMapToken, action: TMapAction, maxValues: TCoord): boolean {
	switch(action) {
		case "MapUpLeft": return or(up(token), left(token));
		case "MapUp": return up(token);
		case "MapUpRight": return or(up(token), right(token, maxValues.x));
		case "MapLeft": return left(token);
		case "MapRight": return right(token, maxValues.x);
		case "MapDownLeft": return or(down(token, maxValues.y), left(token));
		case "MapDown": return down(token, maxValues.y);
		case "MapDownRight": return or(down(token, maxValues.y), right(token, maxValues.x));
		default: return false;
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

function toggleToken(mapCore: TMapCore, userDid: Discord.Snowflake): boolean {
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
async function actionHandler(sageInteraction: SageInteraction, actionData: TActionData): Promise<void> {
	const mapCore = actionData.mapCore;
	const userDid = sageInteraction.user.id;
	const activeToken = getActiveToken(mapCore, userDid);
	const mapAction = actionData.mapAction;
	let updated = false;
	if (mapAction === "MapConfig") {
		updated = or(toggleToken(mapCore, userDid), shuffleToken(mapCore, userDid, "top"))
			&& await utils.FsUtils.writeFile(getMapFilePath(mapCore.id, "core"), mapCore)
			&& await updateMap(sageInteraction.interaction.message as Discord.Message, mapCore);
		if (updated) {
			return sageInteraction.reply(`Your Active Token is: ${getActiveToken(mapCore, userDid)?.name ?? "Unknown"}`, true);
		}
	}else if (activeToken) {
		shuffleToken(mapCore, userDid, "top");
		updated = moveToken(activeToken, mapAction, { x:mapCore.cols - 1, y:mapCore.rows - 1})
			&& await utils.FsUtils.writeFile(getMapFilePath(mapCore.id, "core"), mapCore)
			&& await updateMap(sageInteraction.interaction.message as Discord.Message, mapCore);
		if (updated) {
			return sageInteraction.reply(`Doing it!`, false).then(() => sageInteraction.deleteReply());
		}
	}
	return sageInteraction.reply(`Nothing Changed.`, true);
}

export function registerCommandHandlers(): void {
	registerInteractionListener(actionTester, actionHandler);
	registerInteractionListener(mapCreateTester, mapCreateHandler);
	registerInteractionListener(mapTokenTester, mapTokenHandler);
}

function mapCreateTester(sageInteraction: SageInteraction): boolean {
	return !!sageInteraction.interaction.channel
		&& sageInteraction.isCommand("map", "create");
}
function mapTokenTester(sageInteraction: SageInteraction): boolean {
	return !!sageInteraction.interaction.channel
		&& sageInteraction.isCommand("map", "token");
}

async function mapCreateHandler(sageInteraction: SageInteraction): Promise<void> {
	await sageInteraction.defer(true);
	const imageUrl = sageInteraction.getString("url", true);
	let mapCore: TMapCore | null = null;
	if (isValidMap(imageUrl)) {
		mapCore = await getMapCore(imageUrl);
	}else {
		const mapCols = sageInteraction.getNumber("cols", true);
		const mapRows = sageInteraction.getNumber("rows", true);
		const mapName = sageInteraction.getString("name", true);
		const mapId = utils.UuidUtils.generate();
		const imagePath = getMapFilePath(mapId, "original");
		const imageSaved = await downloadImage(imageUrl, imagePath).catch(utils.ConsoleUtils.Catchers.errorReturnFalse);
		if (imageSaved) {
			mapCore = {
				cols: mapCols,
				id: mapId,
				name: mapName,
				rows: mapRows,
				tokens: [],
				url: imageUrl
			};
			const coreSaved = await utils.FsUtils.writeFile(getMapFilePath(mapId, "core"), mapCore, true).catch(utils.ConsoleUtils.Catchers.errorReturnFalse);
			if (!coreSaved) {
				return sageInteraction.reply(`Sorry, something went wrong.`, true);
			}
		}
	}
	if (mapCore) {
		const rendered = await renderMap(sageInteraction.interaction.channel as TChannel, mapCore).catch(utils.ConsoleUtils.Catchers.errorReturnFalse);
		if (rendered) {
			sageInteraction.reply(`Doing it!`, true).then(() => sageInteraction.deleteReply());
		}
	}
	return sageInteraction.reply(`Sorry, something went wrong.`, true);
}

async function mapTokenHandler(sageInteraction: SageInteraction): Promise<void> {
	const mapId = sageInteraction.getString("map", true);
	if (!isValidMap(mapId)) {
		return sageInteraction.reply("Invalid MapId!", true);
	}
	await sageInteraction.defer(true);

	const mapCore = await getMapCore(mapId) as TMapCore;

	const token: TMapToken = {
		active: true,
		cols: sageInteraction.getNumber("cols") ?? 1,
		id: utils.UuidUtils.generate(),
		name: sageInteraction.getString("name", true),
		rows: sageInteraction.getNumber("rows") ?? 1,
		url: sageInteraction.getString("url", true),
		user: sageInteraction.user.id,
		x: 1,
		y: 1
	};

	const imagePath = getTokenFilePath(mapId, token.id);
	let imageSaved = false;
	if (isValidToken(mapId, token.url)) {
		const imageBuffer = await utils.FsUtils.readFile(getTokenFilePath(mapId, token.url));
		imageSaved = await utils.FsUtils.writeFile(imagePath, imageBuffer);
	}else {
		imageSaved = await downloadImage(token.url, imagePath).catch(utils.ConsoleUtils.Catchers.errorReturnFalse);
	}
	if (imageSaved) {
		// mark other tokens for this user inactive before pushing new active token
		mapCore.tokens.forEach(_token => _token.active =_token.user === token.user ? false : _token.active);
		mapCore.tokens.push(token);
		const updated = await utils.FsUtils.writeFile(getMapFilePath(mapId, "core"), mapCore);
		if (updated) {
			const rendered = await renderMap(sageInteraction.interaction.channel as TChannel, mapCore).catch(utils.ConsoleUtils.Catchers.errorReturnFalse);
			if (rendered) {
				return sageInteraction.reply(`Doing it!`, true).then(() => sageInteraction.deleteReply());
			}
		}
	}
	return sageInteraction.reply(`Sorry, something went wrong.`, true);
}

async function buildMap(mapCore: TMapCore): Promise<boolean> {
	const mapMeta: TMapMeta = {
		filePath: getMapFilePath(mapCore.id, "original"),
		cols: mapCore.cols,
		rows: mapCore.rows
	};
	const tokenMetas = mapCore.tokens.map(token => ({
		filePath: getTokenFilePath(mapCore.id, token.id),
		cols: token.cols ?? 1,
		rows: token.rows ?? 1,
		x: token.x ?? 0,
		y: token.y ?? 0
	} as TTokenMeta));
	const pngBuffer = await mapToBuffer(mapMeta, tokenMetas, "image/jpeg").catch(utils.ConsoleUtils.Catchers.errorReturnNull);
	if (pngBuffer) {
		return utils.FsUtils.writeFile(getMapFilePath(mapCore.id, "render"), pngBuffer, true);
	}else {
		console.warn(`Failed to build Map.`);
	}
	return false;
}

async function renderMap(channel: TChannel, mapCore: TMapCore): Promise<boolean> {
	const built = await buildMap(mapCore);
	if (built) {
		const fileBuffer = await utils.FsUtils.readFile(getMapFilePath(mapCore.id, "render"));
		const components = createMapButtons(mapCore.id);
		const message = await channel.send({ files:[fileBuffer], components:components }).catch(utils.ConsoleUtils.Catchers.errorReturnNull);
		return message !== null;
	}
	return false;
}
async function updateMap(message: Discord.Message, mapCore: TMapCore): Promise<boolean> {
	const built = await buildMap(mapCore);
	if (built) {
		const fileBuffer = await utils.FsUtils.readFile(getMapFilePath(mapCore.id, "render"));
		const components = createMapButtons(mapCore.id);
		const updated = await message.edit({ files:[fileBuffer], components:components }).catch(utils.ConsoleUtils.Catchers.errorReturnNull);
		return updated !== null;
	}
	return false;
}

function mapCommand(): TSlashCommand {
	return {
		name: "Map",
		description: "Map Commands",
		children: [
			{
				name: "Create",
				description: "Sets the map for this channel.",
				options: [
					{ name:"url", description:"Url to the map image.", isRequired:true },
					{ name:"name", description:"What do you call this map?", isRequired:true },
					{ name:"cols", description:"How many columns on this map?", isNumber:true, isRequired:true },
					{ name:"rows", description:"How many rows on this map?", isNumber:true, isRequired:true }
				]
			},
			{
				name: "Token",
				description: "Adds a token to a map",
				options: [
					{ name:"map", description:"Map Id?", isRequired:true, },
					{ name:"url", description:"Url to the token image.", isRequired:true },
					{ name:"name", description:"Who is this?", isRequired:true },
					{ name:"cols", description:"How many columns is this token?", isNumber:true },
					{ name:"rows", description:"How many rows is this token?", isNumber:true }
				]
			}
		]
	};
}

export function registerSlashCommands(): void {
	registerSlashCommand(mapCommand());
}
