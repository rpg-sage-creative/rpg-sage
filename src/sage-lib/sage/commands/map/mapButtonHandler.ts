import { isNonNilSnowflake, type Optional, type Snowflake } from "@rsc-utils/core-utils";
import { ActionRowBuilder, Message, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "discord.js";
import { registerInteractionListener } from "../../../discord/handlers.js";
import { discordPromptYesNo } from "../../../discord/prompts.js";
import type { SageInteraction, SageStringSelectInteraction } from "../../model/SageInteraction.js";
import { createMessageDeleteButtonComponents, createMessageDeleteButtonRow } from "../../model/utils/deleteButton.js";
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
	const ensureResults = ensurePlayerCharacter(sageInteraction, gameMap);
	const toggled = gameMap.cycleActiveAura();
	const toggledAura = gameMap.activeAura;

	stack.editReply(localize("SETTING_ACTIVE_AURA_FOR_S_TO_S", activeToken?.name ?? localize("UNKNOWN"), toggledAura?.name ?? localize("NONE")), true);

	const updated = (ensureResults.added.length || toggled)
		&& await renderMap(sageInteraction.interaction.message as Message, gameMap);
	if (updated) {
		return stack.editReply(localize("YOUR_ACTIVE_AURA_FOR_S_IS_S", activeToken?.name ?? localize("UNKNOWN"), toggledAura?.name ?? localize("NONE")));
	}

	return stack.deleteReply();
}

function createMapTokenSelectCustomId(messageId:Snowflake, actorId:Snowflake): string {
	return `map-select-active-token-${messageId}-${actorId}`;
}

function parseMapTokenSelectCustomId(customId: Optional<string>): { messageId:Snowflake; actorId:Snowflake; } | undefined {
	if (!customId?.startsWith("map-select-active-token-")) return undefined;
	const parts = customId.split("-");
	const actorId = parts.pop();
	if (!isNonNilSnowflake(actorId)) return undefined;
	const messageId = parts.pop();
	if (!isNonNilSnowflake(messageId)) return undefined;
	return { messageId, actorId };
}

async function handleTokenSelect(sageInteraction: SageStringSelectInteraction, gameMap: GameMap): Promise<void> {
	const localize = sageInteraction.getLocalizer();
	const stack = sageInteraction.replyStack;

	const ensureResults = ensurePlayerCharacter(sageInteraction, gameMap);

	const selected = gameMap.setActiveToken(sageInteraction.interaction.values[0] as Snowflake);

	const { activeToken } = gameMap;

	const selectMessage = await sageInteraction.fetchMessage();
	if (selectMessage) {
		await stack.defer();
		await selectMessage?.edit({
			content:localize("SETTING_S_AS_ACTIVE", activeToken?.name ?? localize("UNKNOWN")) + " " + stack.spinnerEmoji,
			components: createMessageDeleteButtonComponents(sageInteraction.actorId)
		});
	}else {
		stack.editReply(localize("SETTING_S_AS_ACTIVE", activeToken?.name ?? localize("UNKNOWN")), true);
	}

	let updated = false;

	if (ensureResults.added.length) {
		const message = await sageInteraction.fetchMessage(gameMap.messageId);
		updated = await renderMap(message as Message, gameMap);
	}else {
		updated = selected && await gameMap.save();
	}

	if (!selected || updated) {
		if (selectMessage) {
			await selectMessage.edit({
				content:localize("YOUR_ACTIVE_TOKEN_IS_S", activeToken?.name ?? localize("UNKNOWN")),
				components: createMessageDeleteButtonComponents(sageInteraction.actorId)
			});
		}else {
			await stack.editReply(localize("YOUR_ACTIVE_TOKEN_IS_S", activeToken?.name ?? localize("UNKNOWN")));
		}
		return;
	}

	return stack.editReply(localize("ERROR_SETTING_ACTIVE_TOKEN"));
}

async function actionHandlerMapToken(sageInteraction: SageInteraction, gameMap: GameMap): Promise<void> {
	await sageInteraction.replyStack.defer();
	const tokens = gameMap.userTokens;
	const activeTokenId = gameMap.activeToken.id;
	const select = new StringSelectMenuBuilder().setCustomId(createMapTokenSelectCustomId(gameMap.messageId, sageInteraction.actorId));
	tokens.forEach(token => select.addOptions(new StringSelectMenuOptionBuilder().setValue(token.id).setLabel(token.name).setDefault(token.id === activeTokenId)));
	const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
	await sageInteraction.dChannel?.send({
		content: "Select Active Token",
		components: [row, createMessageDeleteButtonRow(sageInteraction.actorId)],
	});

	// const localize = sageInteraction.getLocalizer();
	// const stack = sageInteraction.replyStack;

	// const ensureResults = ensurePlayerCharacter(sageInteraction, gameMap);
	// const toggled = gameMap.cycleActiveToken();
	// const activeToken = gameMap.activeToken;
	// stack.editReply(localize("SETTING_S_AS_ACTIVE", activeToken?.name ?? localize("UNKNOWN")), true);

	// let updated = false;

	// if (ensureResults.added.length) {
	// 	updated = await renderMap(sageInteraction.interaction.message as Message, gameMap);
	// }else {
	// 	updated = toggled && await gameMap.save();
	// }

	// if (updated) {
	// 	return stack.editReply(localize("YOUR_ACTIVE_TOKEN_IS_S", activeToken?.name ?? localize("UNKNOWN")));
	// }

	// return stack.editReply(localize("ERROR_SETTING_ACTIVE_TOKEN"));
}

async function actionHandlerMapRaise(sageInteraction: SageInteraction, gameMap: GameMap): Promise<void> {
	const localize = sageInteraction.getLocalizer();

	if (!gameMap.isGameMasterOrOwner) {
		const content = localize(sageInteraction.game ? "ONLY_MAP_OWNERS_OR_GAMEMASTERS" : "ONLY_MAP_OWNERS");
		return sageInteraction.reply(content, true);
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

	if (!gameMap.isGameMasterOrOwner) {
		const content = localize(sageInteraction.game ? "ONLY_MAP_OWNERS_OR_GAMEMASTERS" : "ONLY_MAP_OWNERS");
		return sageInteraction.reply(content, true);
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

	const ensureResults = ensurePlayerCharacter(sageInteraction, gameMap);

	const activeImage = gameMap.activeImage;
	const mapAction = actionData.mapAction;
	if (activeImage) {
		const direction = MoveDirection.from(mapAction.slice(3).toLowerCase() as ArrowDirection);
		const dirLabel = `${direction.compassEmoji} (${direction.ordinalLabel})`;
		stack.editReply(localize("MOVING_S_S", activeImage.name, dirLabel), true);

		const moved = gameMap.moveActiveToken(direction);
		const shuffled = gameMap.activeLayer === LayerType.Token ? gameMap.shuffleActiveToken("top") : false;

		const updated = (ensureResults.added.length || moved || shuffled)
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
	if (isMapAction(mapAction)) {
		const gameMap = await GameMap.forActor(sageInteraction);
		if (gameMap) {
			return { gameMap, mapAction };
		}
	}
	return undefined;
}

async function tokenSelectTester(sageInteraction: SageInteraction): Promise<GameMap | undefined> {
	const parsed = parseMapTokenSelectCustomId(sageInteraction.interaction.customId);
	if (parsed) {
		const gameMap = await GameMap.forUser(parsed.messageId, parsed.actorId);
		if (gameMap) {
			return gameMap;
		}
	}
	return undefined;
}

export function registerMapButtons(): void {
	registerInteractionListener(actionTester, actionHandler);
	registerInteractionListener(tokenSelectTester, handleTokenSelect);
}