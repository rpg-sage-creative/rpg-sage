import { registerListeners } from "../../../discord/handlers/registerListeners.js";
import { discordPromptYesNo } from "../../../discord/prompts.js";
import type { SageMessage } from "../../model/SageMessage.js";
import { includeDeleteButton } from "../../model/utils/deleteButton.js";
import { ensurePlayerCharacter } from "./ensurePlayerCharacter.js";
import { GameMap, type TCompassDirection } from "./GameMap.js";
import { LayerType, type TGameMapToken } from "./GameMapBase.js";
import { renderMap } from "./renderMap.js";

function inputToCompassDirections(sageMessage: SageMessage): TCompassDirection[] {
	const directions: TCompassDirection[] = [];
	const matches = sageMessage.slicedContent.match(/\[\s*(\b(\s|nw|n|ne|w|e|sw|s|se)\b)+\s*\]/ig);
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
	if (!directions.length) {
		return sageMessage.reply(includeDeleteButton({ content:`Please include the directions you wish to move your token. For example:\n> sage! map move [NW N NE W E SW S SE]` }, mapUserId));
	}

	const gameMap = mapExists ? await GameMap.forUser(mapMessageId, mapUserId, true) : null;
	if (!gameMap) {
		return sageMessage.reply(includeDeleteButton({ content:`Sorry, there was a problem loading your map!` }, mapUserId));
	}

	const stack = sageMessage.replyStack;

	ensurePlayerCharacter(sageMessage, gameMap);

	let activeImage = gameMap.activeImage;

	const getArg = (key: string) => {
		const value = sageMessage.args.getString(key);
		if (!value) return undefined;
		const lower = value?.toLowerCase();
		return { key, value, lower };
	};

	const targetTokenArg = getArg("token");
	const targetTerrainArg = getArg("terrain");
	const targetNameArg = getArg("name");

	if (targetTokenArg || targetNameArg) {
		let token: TGameMapToken | undefined;
		// check token name for token arg
		if (targetTokenArg) {
			token = gameMap.userTokens.find(t => t.name.toLowerCase() === targetTokenArg.lower);
		}
		// check token name for name arg
		if (!token && targetNameArg) {
			token = gameMap.userTokens.find(t => t.name.toLowerCase() === targetNameArg.lower);
		}
		// check token for char id by name arg
		if (!token && targetNameArg) {
			const char = sageMessage.game?.findCharacterOrCompanion(targetNameArg.value)
				?? sageMessage.sageUser.findCharacterOrCompanion(targetNameArg.value);
			if (char) {
				token = gameMap.userTokens.find(t => t.characterId === char.id)
					?? gameMap.userTokens.find(t => char.matches(t.name));
			}
		}
		if (!token) {
			return stack.editReply(`Unable to find token: ${targetTokenArg?.value ?? targetNameArg?.value}`);
		}
		gameMap.activeLayer = LayerType.Token;
		gameMap.activeImage = token;
		activeImage = token;

	}else if (targetTerrainArg) {
		const terrain = gameMap.userTerrain.find(t => t.name.toLowerCase() === targetTerrainArg.lower);
		if (!terrain) {
			return stack.editReply("Unable to find terrain: " + targetTerrainArg);
		}
		gameMap.activeLayer = LayerType.Terrain;
		gameMap.activeImage = terrain;
		activeImage = terrain;

	}

	if (!activeImage) {
		return stack.editReply(`You have no image to move!`);
	}

	const moveEmoji = directions.map(dir => `[${dir}]`).join(" ");
	const boolMove = await discordPromptYesNo(sageMessage, `Move ${activeImage.name} ${moveEmoji} ?`, true);
	if (boolMove === true) {
		stack.editReply(`Moving ${activeImage.name} ${moveEmoji} ...`, true);
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

export function registerMapMove(): void {
	registerListeners({ commands:["map|move"], message:mapMoveHandler });
}