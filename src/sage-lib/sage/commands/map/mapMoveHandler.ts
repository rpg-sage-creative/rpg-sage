import { DiscordMaxValues } from "@rsc-utils/discord-utils";
import { StringMatcher, truncate } from "@rsc-utils/string-utils";
import type { LocalizedTextKey } from "../../../../sage-lang/getLocalizedText.js";
import { deleteMessage } from "../../../discord/deletedMessages.js";
import { registerListeners } from "../../../discord/handlers/registerListeners.js";
import { discordPromptYesNo } from "../../../discord/prompts.js";
import type { SageCommand } from "../../model/SageCommand.js";
import type { SageMessage } from "../../model/SageMessage.js";
import { ensurePlayerCharacter } from "./ensurePlayerCharacter.js";
import { GameMap } from "./GameMap.js";
import { LayerType, type TGameMapImage } from "./GameMapBase.js";
import { MoveDirection, MoveDirectionOutputType, type Direction } from "./MoveDirection.js";
import { renderMap } from "./renderMap.js";

/** prepares the given name for comparison */
function prepName(name: string): string {
	return StringMatcher.clean(name).replace(/\s+/g, "");
}

type ArgData = { key:string; value:string; matcher:StringMatcher; };
/** iterates through the keys to find one that has a value to return */
function getArg(sageCommand: SageCommand, ...keys: string[]): ArgData | undefined {
	for (const key of keys) {
		if (key) {
			const value = sageCommand.args.getString(key);
			if (value) {
				return { key, value, matcher:StringMatcher.from(value) };
			}
		}
	}
	return undefined;
}

type ArrayArgData = ArgData & { values:string[]; matchers:StringMatcher[]; };
/** iterates through the keys to find one that has a value to return; returns original value/matcher and an array of values/matchers */
function getArrayArg(sageCommand: SageCommand, ...keys: string[]): ArrayArgData | undefined {
	const arg = getArg(sageCommand, ...keys);
	if (arg) {
		const values = arg.value.split(/\s*,\s*/);
		const matchers = values.map(s => StringMatcher.from(s));
		return { ...arg, values, matchers };
	}
	return arg;
}

type GetMovementKeyArgs = { name:string; path?:never; } | { name?:never; path?:string; };
/** gets movement for the given name or path; "path" is a fallback if the given path arg doesn't find anything; if no "name" is given, sliceContent is also a fallback */
function getMovement(sageCommand: SageCommand, keyArgs?: GetMovementKeyArgs) {
	const keys: string[] = [];
	if (keyArgs?.name) {
		keys.push(keyArgs.name);
	}else {
		if (keyArgs?.path) {
			keys.push(keyArgs.path);
		}
		keys.push("path");
	}

	const pathArg = getArg(sageCommand, ...keys);
	if (pathArg) {
		// remove brackets from either end and add new ones; this allows the path arg to *NOT* require brackets
		const value = `[${pathArg.value.replace(/(^\s*\[\s*)|(\s*\]\s*$)/g, "")}]`;
		return MoveDirection.collect(value);
	}

	// if we are getting a named arg, we do not want to fall back to slicedContent
	if (!keyArgs?.name && sageCommand.isSageMessage()) {
		return MoveDirection.collect(sageCommand.slicedContent);
	}

	return [];
}

type MoveDataSuccess = {
	image: TGameMapImage;
	layer: LayerType;
	localizeKey?: never;
	movement: Direction[];
	name: string;
};
type MoveDataFailure = {
	image?: never;
	layer?: never;
	localizeKey: LocalizedTextKey;
	movement?: never;
	name: string;
};
type MoveDataResult = MoveDataSuccess | MoveDataFailure;

type MoveEmojiData = MoveDataSuccess & { compactEmoji:string; verboseEmoji:string; };

/** Matches the image names to the matcher; uses regex if the matchValue includes an asterisk "*" */
function matchImages<T extends TGameMapImage>(images: T[], matcher: StringMatcher): T[] {
	if (matcher.matchValue.includes("*")) {
		const regex = matcher.toRegex({ asterisk:true, whitespace:"optional" });
		return images.filter(image => regex.test(prepName(image.name)));
	}
	return images.filter(image => matcher.matches(image.name));
}

/** Finds the images that match the given arg values; returns images and arg values that didn't find images */
function findImages<T extends TGameMapImage>(images: T[], arg: ArrayArgData) {
	const foundImages: T[] = [];
	const missingNames: string[] = [];

	const { values, matchers } = arg;

	values.forEach((name, index) => {
		const matchedImages = matchImages(images, matchers[index]);
		if (matchedImages.length) {
			foundImages.push(...matchedImages);
		}else {
			missingNames.push(name);
		}
	});

	return { foundImages, missingNames };
}

/** Gets move data from the "tokens" arg */
function getTokensMoveData(sageCommand: SageCommand, gameMap: GameMap): MoveDataResult[] {
	const targetTokensArg = getArrayArg(sageCommand, "tokens");

	// we have nothing to find
	if (!targetTokensArg) {
		return [];
	}

	const { foundImages, missingNames } = findImages(gameMap.userTokens, targetTokensArg);

	if (missingNames.length) {
		const localizeKey = "UNABLE_TO_FIND_TOKEN_S";
		return missingNames.map(name => ({ localizeKey, name }));
	}

	const layer = LayerType.Token;
	const movement = getMovement(sageCommand, { path:"tokensPath" });
	return foundImages.map(image => ({ layer, image, movement, name:image.name }));
}

/** gets move data from either "token" arg or "name" arg; "name" arg looks up linked tokens by character name */
function getTokenMoveData(sageCommand: SageCommand, gameMap: GameMap): MoveDataResult[] {
	const targetNameArg = getArg(sageCommand, "name");
	const targetTokenArg = getArg(sageCommand, "token");

	// we have nothing to find
	if (!targetNameArg && !targetTokenArg) {
		return [];
	}

	// check token name for token arg
	if (targetTokenArg) {
		const image = gameMap.userTokens.find(t => targetTokenArg.matcher.matches(t.name));
		if (image) {
			return [{ layer:LayerType.Token, image, movement:getMovement(sageCommand, { path:"tokenPath" }), name:image.name }];
		}
	}

	if (targetNameArg) {
		// check token name for name arg
		const image = gameMap.userTokens.find(t => targetNameArg.matcher.matches(t.name));
		if (image) {
			return [{ layer:LayerType.Token, image, movement:getMovement(sageCommand, { path:"namePath" }), name:image.name }];
		}

		// check token for char id by name arg
		const char = sageCommand.game?.findCharacterOrCompanion(targetNameArg.value)
			?? sageCommand.sageUser.findCharacterOrCompanion(targetNameArg.value);
		if (char) {
			// check all for id before checking any by name
			const image = gameMap.userTokens.find(t => t.characterId === char.id)
				?? gameMap.userTokens.find(t => char.matches(t.name));
			if (image) {
				return [{ layer:LayerType.Token, image, movement:getMovement(sageCommand, { path:"namePath" }), name:image.name }];
			}
		}
	}

	return [{ localizeKey:"UNABLE_TO_FIND_TOKEN_S", name:targetTokenArg?.value??targetNameArg?.value! }];
}

/** gets move data by "terrain" arg */
function getTerrainMoveData(sageCommand: SageCommand, gameMap: GameMap): MoveDataResult[] {
	const targetTerrainArg = getArrayArg(sageCommand, "terrain");

	// we have nothing to find
	if (!targetTerrainArg) {
		return [];
	}

	const { foundImages, missingNames } = findImages(gameMap.userTokens, targetTerrainArg);

	if (missingNames.length) {
		const localizeKey = "UNABLE_TO_FIND_TERRAIN_S";
		return missingNames.map(name => ({ localizeKey, name }));
	}

	const layer = LayerType.Terrain;
	const movement = getMovement(sageCommand, { path:"terrainPath" });
	return foundImages.map(image => ({ layer, image, movement, name:image.name }));
}

/** gets move data by other args that represent token names */
function getKeyedMoveData(sageCommand: SageCommand, gameMap: GameMap): MoveDataResult[] {
	const mapImages = (images: TGameMapImage[], layer: LayerType) => images.map(image => (
		{ layer, image, movement: getMovement(sageCommand, { name:prepName(image.name) }), name: image.name }
	)).filter(data => data.movement.length);
	const tokenData = mapImages(gameMap.userTokens, LayerType.Token);
	const terrainData = mapImages(gameMap.userTerrain, LayerType.Terrain);
	return tokenData.concat(terrainData);
}

/** list them all out in all their glory */
function _createPromptContentLong(sageCommand: SageCommand, emojiData: MoveEmojiData[], localizeKey: LocalizedTextKey, emojiKey: "verboseEmoji" | "compactEmoji"): string {
	const localizer = sageCommand.getLocalizer();
	const lines = emojiData.map(data => localizer(localizeKey, data.name, data[emojiKey]));
	return sageCommand.sageCache.format(lines.join("\n"));
}

/** merge tokens with identical paths */
function _createPromptContentShort(sageCommand: SageCommand, emojiData: MoveEmojiData[], localizeKey: LocalizedTextKey, emojiKey: "verboseEmoji" | "compactEmoji"): string {
	// condense by merging like paths
	const longMergedMap = emojiData.reduce((map, data) => {
		if (!map.has(data[emojiKey])) {
			map.set(data[emojiKey], []);
		}
		map.get(data[emojiKey])?.push(data);
		return map;
	}, new Map<string, MoveEmojiData[]>());

	const localizer = sageCommand.getLocalizer();
	const lines = [...longMergedMap.entries()].map(entry => localizer(localizeKey, entry[1].map(data => data.name).join(", "), entry[0]));
	return sageCommand.sageCache.format(lines.join("\n"));
}

/** creates prompt/update content by ensuring that too much text gets shortened so that it fits within a character limit. */
function createPromptContent(sageCommand: SageCommand, emojiData: MoveEmojiData[], localizeKey: LocalizedTextKey): string {
	const { contentLength } = DiscordMaxValues.message;

	if (sageCommand.sageUser.moveDirectionOutputType === MoveDirectionOutputType.Verbose) {
		const vLongContent = _createPromptContentLong(sageCommand, emojiData, localizeKey, "verboseEmoji");
		if (vLongContent.length <= contentLength) {
			return vLongContent;
		}

		const vShortContent = _createPromptContentShort(sageCommand, emojiData, localizeKey, "verboseEmoji");
		if (vShortContent.length <= contentLength) {
			return vShortContent;
		}
	}

	const cLongContent = _createPromptContentLong(sageCommand, emojiData, localizeKey, "compactEmoji");
	if (cLongContent.length <= contentLength) {
		return cLongContent;
	}

	const cShortContent = _createPromptContentShort(sageCommand, emojiData, localizeKey, "compactEmoji");
	if (cShortContent.length <= contentLength) {
		return cShortContent;
	}

	return truncate(cShortContent, contentLength, true);
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

	const gameMap = await GameMap.forActor(sageMessage);
	if (!gameMap) {
		const content = localize("PROBLEM_LOADING_MAP");
		return stack.whisper({ content });
	}

	ensurePlayerCharacter(sageMessage, gameMap);

	const tokensMoveData = getTokensMoveData(sageMessage, gameMap);
	const tokenMoveData = getTokenMoveData(sageMessage, gameMap);
	const terrainMoveData = getTerrainMoveData(sageMessage, gameMap);
	const keyedMoveData = getKeyedMoveData(sageMessage, gameMap);
	const moveData = [...tokensMoveData, ...tokenMoveData, ...terrainMoveData, ...keyedMoveData];
	if (!moveData.length && gameMap.activeImage) {
		moveData.push({
			image: gameMap.activeImage,
			layer: gameMap.activeLayer,
			movement: getMovement(sageMessage),
			name: gameMap.activeImage.name
		});
	}

	if (!moveData.length) {
		const content = localize("NO_IMAGE_TO_MOVE");
		return stack.editReply(content);
	}

	const invalidImages = moveData.filter(data => "localizeKey" in data) as MoveDataFailure[];
	const missingDirections = moveData.filter(data => !data.movement?.length);
	if (invalidImages.length || missingDirections.length) {
		const imagesContent = invalidImages.map(err => localize(err.localizeKey, err.name));
		const directionsContent = missingDirections.length ? [
			localize("INCLUDE_MOVE_DIRECTIONS"),
			localize("FOR_EXAMPLE:"),
			`> sage! map move [NW N NE W E SW S SE]`,
			`> sage! map move token="GoblinA" [N 2NW W]`,
			] : [];
		const content = imagesContent.concat(directionsContent).join("\n");
		return stack.whisper(content);
	}

	const emojiData = (moveData as MoveDataSuccess[]).map(data => ({
		...data,
		compactEmoji:MoveDirection.toEmoji(data.movement, MoveDirectionOutputType.Compact),
		verboseEmoji:MoveDirection.toEmoji(data.movement, MoveDirectionOutputType.Verbose)
	}));

	// debug(emojiData.map(data => ({name:data.name,compactEmoji:data.compactEmoji,verboseEmoji:data.verboseEmoji})));

	const promptContent = createPromptContent(sageMessage, emojiData, "MOVE_S_S_?");
	const boolMove = await discordPromptYesNo(sageMessage, promptContent, true);

	if (boolMove === true) {
		// tell em we are moving things
		const updateContent = createPromptContent(sageMessage, emojiData, "MOVING_S_S");
		stack.editReply(updateContent, true);

		// save current token order
		const unshuffled = gameMap.tokens.slice();

		// move all the tokens
		const moveResults = emojiData.map(data => {
			gameMap.activeLayer = data.layer;
			gameMap.activeImage = data.image;
			gameMap.shuffleActiveToken("top");
			return gameMap.moveActiveToken(...data.movement);
		});

		// see if any actually got moved
		const moved = moveResults.includes(true);

		// compare new order to original
		const shuffled = gameMap.tokens.some((token, index) => unshuffled[index] !== token);

		// only render if we moved/shuffled tokens
		let rendered = false;
		if (moved || shuffled) {
			rendered = await renderMap(await sageMessage.message.fetchReference(), gameMap);
		}

		// let them know there was an error
		if (!rendered) {
			const errorContent = localize("ERROR_MOVING_IMAGE");
			return stack.editReply(errorContent);
		}
	}

	await stack.deleteReply();
	await deleteMessage(sageMessage.message);
}

export function registerMapMove(): void {
	registerListeners({ commands:["map|move"], message:mapMoveHandler });
}