import * as Discord from "discord.js";
import utils, { Optional, VALID_UUID, type UUID } from "../../../sage-utils";
import { mapToBuffer } from "../../../sage-utils/utils/ImageUtils";
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
	messageDid: Discord.Snowflake;
	name: string;
	rows: number;
	tokens: TMapToken[];
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
		updated = or(moveToken(activeToken, mapAction, { x:mapCore.cols - 1, y:mapCore.rows - 1}), shuffleToken(mapCore, userDid, "top"))
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
	sageInteraction.reply(`Fetching image and configuring map ...`, true);

	const mapCore: TMapCore = {
		cols: sageInteraction.getNumber("cols", true),
		id: utils.UuidUtils.generate(),
		messageDid: undefined!,
		name: sageInteraction.getString("name", true),
		rows: sageInteraction.getNumber("rows", true),
		tokens: [],
		url: sageInteraction.getString("url", true)
	};

	const success = await renderMap(sageInteraction.interaction.channel as TChannel, mapCore);
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
		cols: sageInteraction.getNumber("cols") ?? 1,
		id: utils.UuidUtils.generate(),
		name: sageInteraction.getString("name", true),
		rows: sageInteraction.getNumber("rows") ?? 1,
		url: sageInteraction.getString("url", true),
		user: sageInteraction.user.id,
		x: sageInteraction.getNumber("x") ?? 1,
		y: sageInteraction.getNumber("y") ?? 1
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
	const buffer = await mapToBuffer(mapCore).catch(utils.ConsoleUtils.Catchers.errorReturnNull);
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
