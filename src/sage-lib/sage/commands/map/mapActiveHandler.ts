import { registerListeners } from "../../../discord/handlers/registerListeners.js";
import { discordPromptYesNo } from "../../../discord/prompts.js";
import type { SageMessage } from "../../model/SageMessage.js";
import { includeDeleteButton } from "../../model/utils/deleteButton.js";
import { ensurePlayerCharacter } from "./ensurePlayerCharacter.js";
import { GameMap } from "./GameMap.js";
import { LayerType, type TGameMapAura, type TGameMapToken } from "./GameMapBase.js";

/** @deprecated Temporary solution to setting the active terrain, token, or aura. */
async function mapActivateHandler(sageMessage: SageMessage): Promise<void> {
	const mapUserId = sageMessage.sageUser.did;

	const mapMessageId = sageMessage.message.reference?.messageId;
	const mapExists = mapMessageId && GameMap.exists(mapMessageId);
	if (!mapExists) {
		return sageMessage.reply(includeDeleteButton({ content:`Please reply to the map you wish to set your active token for.` }, mapUserId));
	}

	const gameMap = mapExists ? await GameMap.forUser(mapMessageId, mapUserId, true) : null;
	if (!gameMap) {
		return sageMessage.reply(includeDeleteButton({ content:`Sorry, there was a problem loading your map!` }, mapUserId));
	}

	const stack = sageMessage.replyStack;

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
			return stack.editReply(`Unable to find token: ${targetTokenArg?.value ?? targetNameArg?.value}`);
		}
		gameMap.activeLayer = LayerType.Token;
		gameMap.activeImage = token;

	}else if (targetAuraArg) {
		const testAura = (a: TGameMapAura) => a.name.toLowerCase() === targetAuraArg.lower
		let aura = gameMap.auras.find(testAura);
		if (!aura) {
			gameMap.tokens.concat(gameMap.terrain).find(t => t.auras.find(a => {
				if (testAura(a)) { aura = a; return true; }
				return false;
			}));
		}
		if (!aura) {
			return stack.editReply("Unable to find aura: " + targetAuraArg.value);
		}
		gameMap.activeLayer = LayerType.Aura;
		gameMap.activeImage = aura;

	}else if (targetTerrainArg) {
		const terrain = gameMap.userTerrain.find(t => t.name.toLowerCase() === targetTerrainArg.lower);
		if (!terrain) {
			return stack.editReply("Unable to find terrain: " + targetTerrainArg.value);
		}
		gameMap.activeLayer = LayerType.Terrain;
		gameMap.activeImage = terrain;

	}else {
		return stack.editReply(`Nothing to do!`);
	}

	const boolMove = await discordPromptYesNo(sageMessage, `Set ${gameMap.activeImage.name} as active?`, true);
	if (boolMove === true) {
		const updated = await gameMap.save();
		if (!updated) {
			return stack.editReply(`Error setting active item!`);
		}
	}

	return stack.deleteReply();
}

export function registerMapActivate(): void {
	registerListeners({ commands:["map|activate"], message:mapActivateHandler });
}