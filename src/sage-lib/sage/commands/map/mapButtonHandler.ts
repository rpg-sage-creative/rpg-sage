import type { Snowflake } from "@rsc-utils/core-utils";
import { Message } from "discord.js";
import { registerInteractionListener } from "../../../discord/handlers.js";
import { discordPromptYesNo } from "../../../discord/prompts.js";
import type { SageInteraction } from "../../model/SageInteraction.js";
import { ensurePlayerCharacter } from "./ensurePlayerCharacter.js";
import { GameMap } from "./GameMap.js";
import { LayerType } from "./GameMapBase.js";
import { isMapAction, type MapAction } from "./MapActions.js";
import { MoveDirection, type ArrowDirection } from "./MoveDirection.js";
import { renderMap } from "./renderMap.js";

async function actionHandlerMapTerrain(sageInteraction: SageInteraction, gameMap: GameMap): Promise<void> {
	const localize = sageInteraction.getLocalizer();
	const stack = sageInteraction.replyStack;

	const toggled = gameMap.cycleActiveTerrain();
	const activeTerrain = gameMap.activeTerrain;

	stack.reply(localize("SETTING_S_AS_ACTIVE", activeTerrain?.name ?? localize("UNKNOWN")), true);

	const updated = toggled && await gameMap.save();
	if (updated) {
		return stack.editReply(localize("YOUR_ACTIVE_TERRAIN_IS_S", activeTerrain?.name ?? localize("UNKNOWN")));
	}

	return stack.deleteReply();
}

async function actionHandlerMapAura(sageInteraction: SageInteraction, gameMap: GameMap): Promise<void> {
	const localize = sageInteraction.getLocalizer();
	const stack = sageInteraction.replyStack;

	const activeToken = gameMap.activeToken;
	let updated = ensurePlayerCharacter(sageInteraction, gameMap);
	const toggled = gameMap.cycleActiveAura();
	const toggledAura = gameMap.activeAura;

	stack.editReply(localize("SETTING_ACTIVE_AURA_FOR_S_TO_S", activeToken?.name ?? localize("UNKNOWN"), toggledAura?.name ?? localize("NONE")), true);

	updated = toggled
		&& await renderMap(sageInteraction.interaction.message as Message, gameMap);
	if (updated) {
		return stack.editReply(localize("YOUR_ACTIVE_AURA_FOR_S_IS_S", activeToken?.name ?? localize("UNKNOWN"), toggledAura?.name ?? localize("NONE")));
	}

	return stack.deleteReply();
}

async function actionHandlerMapToken(sageInteraction: SageInteraction, gameMap: GameMap): Promise<void> {
	const localize = sageInteraction.getLocalizer();
	const stack = sageInteraction.replyStack;

	const added = ensurePlayerCharacter(sageInteraction, gameMap);
	const toggled = gameMap.cycleActiveToken();
	const activeToken = gameMap.activeToken;

	stack.editReply(localize("SETTING_S_AS_ACTIVE", activeToken?.name ?? localize("UNKNOWN")), true);

	let updated = false;

	if (added) {
		updated = await renderMap(sageInteraction.interaction.message as Message, gameMap);
	}else {
		updated = toggled && await gameMap.save();
	}

	if (updated) {
		return stack.editReply(localize("YOUR_ACTIVE_TOKEN_IS_S", activeToken?.name ?? localize("UNKNOWN")));
	}

	return stack.editReply(localize("ERROR_SETTING_ACTIVE_TOKEN"));
}

async function actionHandlerMapRaise(sageInteraction: SageInteraction, gameMap: GameMap): Promise<void> {
	const localize = sageInteraction.getLocalizer();

	if (!gameMap.isOwner) {
		return sageInteraction.reply(localize("YOU_CANT_EDIT_OTHERS_MAPS"), true);
	}

	const stack = sageInteraction.replyStack;
	let updated = false;
	switch(gameMap.activeLayer) {
		case LayerType.Aura:
			updated = gameMap.shiftOpacity("up");
			stack.editReply(localize("INCREASING_AURA_OPACITY_S", gameMap.activeAura?.name ?? localize("UNKNOWN")), true);
			break;
		case LayerType.Terrain:
			updated = gameMap.shuffleActiveTerrain("up");
			stack.editReply(localize("RAISING_TERRAIN_S", gameMap.activeTerrain?.name ?? localize("UNKNOWN")), true);
			break;
		case LayerType.Token:
		default:
			updated = gameMap.shuffleActiveToken("up");
			stack.editReply(localize("RAISING_TOKEN_S", gameMap.activeToken?.name ?? localize("UNKNOWN")), true);
			break;
	}

	if (updated) {
		updated = await renderMap(sageInteraction.interaction.message as Message, gameMap);
	}

	if (updated) {
		return stack.deleteReply();
	}

	return stack.editReply(localize("ERROR_MANIPULATING_IMAGE"));
}

async function actionHandlerMapLower(sageInteraction: SageInteraction, gameMap: GameMap): Promise<void> {
	const localize = sageInteraction.getLocalizer();

	if (!gameMap.isOwner) {
		return sageInteraction.reply(localize("YOU_CANT_EDIT_OTHERS_MAPS"), true);
	}

	const stack = sageInteraction.replyStack;
	let updated = false;
	switch(gameMap.activeLayer) {
		case LayerType.Aura:
			updated = gameMap.shiftOpacity("down");
			stack.editReply(localize("DECREASING_AURA_OPACITY_S", gameMap.activeAura?.name ?? localize("UNKNOWN")), true);
			break;
		case LayerType.Terrain:
			updated = gameMap.shuffleActiveTerrain("down");
			stack.editReply(localize("LOWERING_TERRAIN_S", gameMap.activeTerrain?.name ?? localize("UNKNOWN")), true);
			break;
		case LayerType.Token:
		default:
			updated = gameMap.shuffleActiveToken("down");
			stack.editReply(localize("LOWERING_TOKEN_S", gameMap.activeToken?.name ?? localize("UNKNOWN")), true);
			break;
	}

	if (updated) {
		updated = await renderMap(sageInteraction.interaction.message as Message, gameMap);
	}

	if (updated) {
		return stack.deleteReply();
	}

	return stack.editReply(localize("ERROR_MANIPULATING_IMAGE"));
}

async function actionHandlerMapConfig(sageInteraction: SageInteraction, _: GameMap): Promise<void> {
	return sageInteraction.reply(sageInteraction.getLocalizer()("NOT_IMPLEMENTED_YET"), true);
}

async function actionHandlerMapDelete(sageInteraction: SageInteraction, gameMap: GameMap): Promise<void> {
	const localize = sageInteraction.getLocalizer();
	const activeImage = gameMap.activeImage;
	if (activeImage) {
		const stack = sageInteraction.replyStack;
		stack.defer();
		const boolDelete = await discordPromptYesNo(sageInteraction, localize("DELETE_IMAGE_S_?", activeImage.name), true);
		if (boolDelete) {
			stack.editReply(localize("DELETING_IMAGE_S", activeImage.name), true);

			const deleted = gameMap.deleteImage(activeImage);
			const updated = deleted && await renderMap(sageInteraction.interaction.message as Message, gameMap);
			if (updated) {
				return stack.editReply(localize("DELETED_IMAGE_S", activeImage.name));
			}

			return stack.editReply(localize("ERROR_DELETING_IMAGE"));
		}
		return stack.deleteReply();

	}else {
		return sageInteraction.reply(localize("NO_IMAGE_TO_MOVE"), true);
	}
}

async function actionHandlerMapMove(sageInteraction: SageInteraction, actionData: TActionData): Promise<void> {
	const localize = sageInteraction.getLocalizer();
	const stack = sageInteraction.replyStack;

	const gameMap = actionData.gameMap;
	let updated = ensurePlayerCharacter(sageInteraction, gameMap);
	const activeImage = gameMap.activeImage;
	const mapAction = actionData.mapAction;
	if (activeImage) {
		const direction = MoveDirection.from(mapAction.slice(3).toLowerCase() as ArrowDirection);
		const dirLabel = `${direction.compassEmoji} (${direction.ordinalText})`;
		stack.editReply(localize("MOVING_S_S", activeImage.name, dirLabel), true);

		const moved = gameMap.moveActiveToken(direction);
		const shuffled = gameMap.activeLayer === LayerType.Token ? gameMap.shuffleActiveToken("top") : false;

		updated = (moved || shuffled)
			&& await renderMap(sageInteraction.interaction.message as Message, gameMap);
		if (updated) {
			return stack.deleteReply();
		}

		return stack.editReply(localize("ERROR_MOVING_IMAGE"));
	}

	return sageInteraction.reply(localize("NO_IMAGE_TO_MOVE"), true);
}

async function actionHandler(sageInteraction: SageInteraction, actionData: TActionData): Promise<void> {
	const { gameMap } = actionData;
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

type TActionData = { gameMap:GameMap; mapAction:MapAction; };

/** Returns action data (mapCore and mapAction) or undefined */
async function actionTester(sageInteraction: SageInteraction): Promise<TActionData | undefined> {
	// const [mapId, mapAction] = (sageInteration.interaction.customId ?? "").split("|") as [Discord.Snowflake, TMapAction];
	const mapAction = (sageInteraction.interaction.customId ?? "").split("|")[1];
	const messageId = sageInteraction.interaction.message?.id;
	if (isMapAction(mapAction) && messageId && GameMap.exists(messageId)) {
		const userDid = sageInteraction.user?.id;
		const gameMap = userDid ? await GameMap.forUser(messageId, sageInteraction.user.id as Snowflake, true) : null;
		if (gameMap) {
			return { gameMap, mapAction };
		}
	}
	return undefined;
}

export function registerMapButtons(): void {
	registerInteractionListener(actionTester, actionHandler);
}