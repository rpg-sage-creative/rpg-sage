import { registerListeners } from "../../../discord/handlers/registerListeners.js";
import { discordPromptYesNo } from "../../../discord/prompts.js";
import type { SageMessage } from "../../model/SageMessage.js";
import { ensurePlayerCharacter } from "./ensurePlayerCharacter.js";
import { GameMap, type TCompassDirection } from "./GameMap.js";
import { LayerType, type TGameMapToken } from "./GameMapBase.js";
import { renderMap } from "./renderMap.js";

function inputToCompassDirections(sageMessage: SageMessage): TCompassDirection[] {
	const directions: TCompassDirection[] = [];
	// blocks array should be something like: [ '[ S S E ]', '[2N]', '[W3]' ]
	const blocks = sageMessage.slicedContent.match(/\[\s*(?:\b(?:\s|\d+(?:nw|n|ne|w|e|sw|s|se)|(?:nw|n|ne|w|e|sw|s|se)\d*)\b)+\s*\]/gi);

	// each block should be something like: '[ S S E ]' or '[2N]' or 'W3'
	blocks?.forEach(block => {
		// pairs array should be something like: ["s", "2n", "w3"]
		const pairs = block.slice(1, -1).toLowerCase().split(/\s/).filter(s => s);

		// each pair should be something like: "s" or "2n" or "w3"
		pairs.forEach(pair => {
			// test with required number prefix before testing witth optional number suffix
			const distAndDir = /(?<distance>\d+)(?<direction>nw|n|ne|w|e|sw|s|se)/.exec(pair)
				?? /(?<direction>nw|n|ne|w|e|sw|s|se)(?<distance>\d+)?/.exec(pair);

			// direction is there, distance is optional
			const { direction, distance } = distAndDir?.groups!; // NOSONAR

			// default count to 1
			const count = +(distance ?? 1);

			// add the direction "distance" number of times
			for (let i = 0; i < count; i++) {
				directions.push(direction as TCompassDirection);
			}
		});
	});
	return directions;
}

async function mapMoveHandler(sageMessage: SageMessage): Promise<void> {
	const localize = sageMessage.getLocalizer();
	const stack = sageMessage.replyStack;

	const mapMessageId = sageMessage.message.reference?.messageId;
	const mapExists = mapMessageId && GameMap.exists(mapMessageId);
	if (!mapExists) {
		const content = localize("REPLY_TO_MAP_TO_MOVE");
		return stack.whisper({ content });
	}

	const directions = inputToCompassDirections(sageMessage);
	if (!directions.length) {
		const content = [
			localize("INCLUDE_MOVE_DIRECTIONS"),
			localize("FOR_EXAMPLE:"),
			`> sage! map move [NW N NE W E SW S SE]`,
			`> sage! map move [N 2NW W]`,
		].join("\n");
		return stack.whisper({ content });
	}

	const mapUserId = sageMessage.sageUser.did;
	const gameMap = mapExists ? await GameMap.forUser(mapMessageId, mapUserId, true) : null;
	if (!gameMap) {
		const content = localize("PROBLEM_LOADING_MAP");
		return stack.whisper({ content });
	}

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
			const content = localize("UNABLE_TO_FIND_TOKEN_S", targetTokenArg?.value ?? targetNameArg?.value!);
			return stack.editReply(content);
		}
		gameMap.activeLayer = LayerType.Token;
		gameMap.activeImage = token;
		activeImage = token;

	}else if (targetTerrainArg) {
		const terrain = gameMap.userTerrain.find(t => t.name.toLowerCase() === targetTerrainArg.lower);
		if (!terrain) {
			const content = localize("UNABLE_TO_FIND_TERRAIN_S", targetTerrainArg.value);
			return stack.editReply(content);
		}
		gameMap.activeLayer = LayerType.Terrain;
		gameMap.activeImage = terrain;
		activeImage = terrain;

	}

	if (!activeImage) {
		const content = localize("NO_IMAGE_TO_MOVE");
		return stack.editReply(content);
	}

	const moveEmoji = directions.map(dir => `[${dir}]`).join(" ");
	const promptContent = localize("MOVE_S_S_?", activeImage.name, moveEmoji);
	const boolMove = await discordPromptYesNo(sageMessage, promptContent, true);
	if (boolMove === true) {
		const updateContent = localize("MOVING_S_S", activeImage.name, moveEmoji);
		stack.editReply(updateContent, true);
		const moved = gameMap.moveActiveToken(...directions);
		const shuffled = gameMap.activeLayer === LayerType.Token ? gameMap.shuffleActiveToken("top") : false;
		const updated = (moved || shuffled)
			&& await renderMap(await sageMessage.message.fetchReference(), gameMap);
		if (!updated) {
			const errorContent = localize("ERROR_MOVING_IMAGE");
			return stack.editReply(errorContent);
		}
	}

	return stack.deleteReply();
}

export function registerMapMove(): void {
	registerListeners({ commands:["map|move"], message:mapMoveHandler });
}