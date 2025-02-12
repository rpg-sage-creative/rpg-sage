import { registerListeners } from "../../../discord/handlers/registerListeners.js";
import { discordPromptYesNo } from "../../../discord/prompts.js";
import type { SageMessage } from "../../model/SageMessage.js";
import { ensurePlayerCharacter } from "./ensurePlayerCharacter.js";
import { GameMap } from "./GameMap.js";
import { LayerType, type TGameMapAura, type TGameMapToken } from "./GameMapBase.js";

/** @deprecated Temporary solution to setting the active terrain, token, or aura. */
async function mapActivateHandler(sageMessage: SageMessage): Promise<void> {
	const localize = sageMessage.getLocalizer();
	const stack = sageMessage.replyStack;

	const mapMessageId = sageMessage.message.reference?.messageId;
	const mapExists = mapMessageId && GameMap.exists(mapMessageId);
	if (!mapExists) {
		const content = localize("REPLY_TO_MAP_TO_ACTIVATE");
		return stack.whisper({ content });
	}

	const gameMap = await GameMap.forActor(sageMessage);
	if (!gameMap) {
		const content = localize("PROBLEM_LOADING_MAP");
		return stack.whisper({ content });
	}

	ensurePlayerCharacter(sageMessage, gameMap);

	const getArg = (key: string) => {
		const value = sageMessage.args.getString(key);
		if (!value) return undefined;
		const lower = value?.toLowerCase();
		return { key, value, lower };
	};

	const targetTokenArg = getArg("token");
	const targetAuraArg = getArg("aura");
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

	}else if (targetAuraArg) {
		const testAura = (a: TGameMapAura) => a.name.toLowerCase() === targetAuraArg.lower;
		let aura = gameMap.auras.find(testAura);
		if (!aura) {
			// the first token/terrain that has an aura that matches will set the aura and end this find in a find
			gameMap.tokens.concat(gameMap.terrain).find(t => t.auras.find(a => { // NOSONAR
				if (testAura(a)) { aura = a; return true; }                      // NOSONAR
				return false;
			}));
		}
		if (!aura) {
			const content = localize("UNABLE_TO_FIND_AURA_S", targetAuraArg.value);
			return stack.editReply(content);
		}
		gameMap.activeLayer = LayerType.Aura;
		gameMap.activeImage = aura;

	}else if (targetTerrainArg) {
		const terrain = gameMap.userTerrain.find(t => t.name.toLowerCase() === targetTerrainArg.lower);
		if (!terrain) {
			const content = localize("UNABLE_TO_FIND_TERRAIN_S", targetTerrainArg.value);
			return stack.editReply(content);
		}
		gameMap.activeLayer = LayerType.Terrain;
		gameMap.activeImage = terrain;

	}else {
		const content = localize("NO_IMAGE_TO_ACTIVATE");
		return stack.editReply(content);
	}

	const promptContent = localize("SET_S_AS_ACTIVE_?", gameMap.activeImage.name);
	const boolMove = await discordPromptYesNo(sageMessage, promptContent, true);
	if (boolMove === true) {
		const updated = await gameMap.save();
		if (!updated) {
			const content = localize("ERROR_SETTING_ACTIVE_IMAGE");
			return stack.editReply(content);
		}
	}

	return stack.deleteReply();
}

export function registerMapActivate(): void {
	registerListeners({ commands:["map|activate"], message:mapActivateHandler });
}