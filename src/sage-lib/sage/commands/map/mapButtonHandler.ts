import type { Snowflake } from "@rsc-utils/core-utils";
import { Message } from "discord.js";
import { registerInteractionListener } from "../../../discord/handlers.js";
import { discordPromptYesNo } from "../../../discord/prompts.js";
import type { SageInteraction } from "../../model/SageInteraction.js";
import { ensurePlayerCharacter } from "./ensurePlayerCharacter.js";
import { GameMap, type TMoveDirection } from "./GameMap.js";
import { LayerType } from "./GameMapBase.js";
import { isMapAction, type MapAction } from "./MapActions.js";
import { renderMap } from "./renderMap.js";

/** get text for human readable direction */
function toDirection(action: MapAction): string {
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

async function actionHandlerMapTerrain(sageInteraction: SageInteraction, gameMap: GameMap): Promise<void> {
	const stack = sageInteraction.replyStack;
	const toggled = gameMap.cycleActiveTerrain();
	const activeTerrain = gameMap.activeTerrain;
	stack.reply(`Setting ${activeTerrain?.name} as active ...`, true);
	const updated = toggled && await gameMap.save();
	if (updated) {
		return stack.editReply(`Your active terrain is: ${activeTerrain?.name ?? "Unknown"}`);
	}
	return stack.deleteReply();
}

async function actionHandlerMapAura(sageInteraction: SageInteraction, gameMap: GameMap): Promise<void> {
	const stack = sageInteraction.replyStack;
	const activeToken = gameMap.activeToken;
	let updated = ensurePlayerCharacter(sageInteraction, gameMap);
	const toggled = gameMap.cycleActiveAura();
	const toggledAura = gameMap.activeAura;
	stack.editReply(`Setting active aura for ${activeToken?.name} to ${toggledAura?.name ?? "none"} ...`, true);
	updated = toggled
		&& await renderMap(sageInteraction.interaction.message as Message, gameMap);
	if (updated) {
		return stack.editReply(`Your active aura for ${activeToken?.name} is: ${toggledAura?.name ?? "none"}`);
	}
	return stack.deleteReply();
}

async function actionHandlerMapToken(sageInteraction: SageInteraction, gameMap: GameMap): Promise<void> {
	const stack = sageInteraction.replyStack;
	const added = ensurePlayerCharacter(sageInteraction, gameMap);
	const toggled = gameMap.cycleActiveToken();
	const activeToken = gameMap.activeToken;
	stack.editReply(`Setting ${activeToken?.name} as active ...`, true);
	let updated = false;
	if (added) {
		updated = await renderMap(sageInteraction.interaction.message as Message, gameMap);
	}else {
		updated = toggled && await gameMap.save();
	}
	if (updated) {
		return stack.editReply(`Your active token is: ${activeToken?.name ?? "Unknown"}`);
	}
	return stack.deleteReply();
}

async function actionHandlerMapRaise(sageInteraction: SageInteraction, gameMap: GameMap): Promise<void> {
	if (!gameMap.isOwner) {
		return sageInteraction.reply(`You can't edit somebody else's map!`, true);
	}
	const stack = sageInteraction.replyStack;
	let updated = false;
	let output = "";
	switch(gameMap.activeLayer) {
		case LayerType.Aura:
			updated = gameMap.shiftOpacity("up");
			stack.editReply(`Increasing Aura Opacity: ${gameMap.activeAura?.name ?? "Unknown"} ...`, true);
			output = `Aura Opacity Increased: ${gameMap.activeAura?.name ?? "Unknown"}`;
			break;
		case LayerType.Terrain:
			updated = gameMap.shuffleActiveTerrain("up");
			stack.editReply(`Raising Terrain: ${gameMap.activeTerrain?.name ?? "Unknown"} ...`, true);
			output = `Terrain Raised: ${gameMap.activeTerrain?.name ?? "Unknown"}`;
			break;
		case LayerType.Token:
		default:
			updated = gameMap.shuffleActiveToken("up");
			stack.editReply(`Raising Token: ${gameMap.activeToken?.name ?? "Unknown"} ...`, true);
			output = `Token Raised: ${gameMap.activeToken?.name ?? "Unknown"}`;
			break;
	}
	if (updated) {
		updated = await renderMap(sageInteraction.interaction.message as Message, gameMap);
	}
	if (updated) {
		return stack.editReply(output);
	}
	return stack.deleteReply();
}

async function actionHandlerMapLower(sageInteraction: SageInteraction, gameMap: GameMap): Promise<void> {
	if (!gameMap.isOwner) {
		return sageInteraction.reply(`You can't edit somebody else's map!`, true);
	}
	const stack = sageInteraction.replyStack;
	let updated = false;
	let output = "";
	switch(gameMap.activeLayer) {
		case LayerType.Aura:
			updated = gameMap.shiftOpacity("down");
			stack.editReply(`Decreasing Aura Opacity: ${gameMap.activeAura?.name ?? "Unknown"} ...`, true);
			output = `Aura Opacity Decreased: ${gameMap.activeAura?.name ?? "Unknown"}`;
			break;
		case LayerType.Terrain:
			updated = gameMap.shuffleActiveTerrain("down");
			stack.editReply(`Lowering Terain: ${gameMap.activeTerrain?.name ?? "Unknown"} ...`, true);
			output = `Terrain Lowered: ${gameMap.activeTerrain?.name ?? "Unknown"}`;
			break;
		case LayerType.Token:
		default:
			updated = gameMap.shuffleActiveToken("down");
			stack.editReply(`Lowering Token: ${gameMap.activeToken?.name ?? "Unknown"} ...`, true);
			output = `Token Lowered: ${gameMap.activeToken?.name ?? "Unknown"}`;
			break;
	}
	if (updated) {
		updated = await renderMap(sageInteraction.interaction.message as Message, gameMap);
	}
	if (updated) {
		return stack.editReply(output);
	}
	return stack.deleteReply();
}

async function actionHandlerMapConfig(sageInteraction: SageInteraction, _: GameMap): Promise<void> {
	return sageInteraction.reply(`Not Implemented ... Yet.`, true);
}

async function actionHandlerMapDelete(sageInteraction: SageInteraction, gameMap: GameMap): Promise<void> {
	const activeImage = gameMap.activeImage;
	if (activeImage) {
		const stack = sageInteraction.replyStack;
		stack.defer();
		const boolDelete = await discordPromptYesNo(sageInteraction, `Delete image: ${activeImage.name}?`, true);
		if (boolDelete) {
			stack.editReply(`Deleting image: ${activeImage.name} ...`, true);
			const deleted = gameMap.deleteImage(activeImage);
			const updated = deleted
				&& await renderMap(sageInteraction.interaction.message as Message, gameMap);
			if (updated) {
				return stack.editReply(`Deleted image: ${activeImage.name}`);
			}
			return stack.editReply(`Error deleting image!`);
		}
		return stack.deleteReply();
	}else {
		return sageInteraction.reply(`You have no image to delete!`, true);
	}
}

async function actionHandlerMapMove(sageInteraction: SageInteraction, actionData: TActionData): Promise<void> {
	const stack = sageInteraction.replyStack;
	const gameMap = actionData.gameMap;
	let updated = ensurePlayerCharacter(sageInteraction, gameMap);
	const activeImage = gameMap.activeImage;
	const mapAction = actionData.mapAction;
	if (activeImage) {
		stack.editReply(`Moving ${activeImage.name} ${toDirection(mapAction)} ...`, true);
		const moved = gameMap.moveActiveToken(mapAction.slice(3).toLowerCase() as TMoveDirection);
		const shuffled = gameMap.activeLayer === LayerType.Token ? gameMap.shuffleActiveToken("top") : false;
		updated = (moved || shuffled)
			&& await renderMap(sageInteraction.interaction.message as Message, gameMap);
		if (updated) {
			return stack.deleteReply();
		}
		return stack.editReply(`Error moving image!`);
	}
	return sageInteraction.reply(`You have no image to move!`, true);
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