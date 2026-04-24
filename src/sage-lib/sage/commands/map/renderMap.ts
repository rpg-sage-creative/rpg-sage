import { errorReturnUndefined, type Optional, type Snowflake } from "@rsc-utils/core-utils";
import type { SupportedTarget } from "@rsc-utils/discord-utils";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Message } from "discord.js";
import type { GameMap } from "./GameMap.js";
import { getMapActionEmoji, isMapAction, type MapAction } from "./MapActions.js";

function createButton(gameMap: GameMap, label: string, style: ButtonStyle): ButtonBuilder {
	const button = new ButtonBuilder();
	button.setCustomId(`${gameMap.id}|${label}`);
	if (isMapAction(label)) {
		button.setEmoji(getMapActionEmoji(label));
	}else {
		button.setLabel(label);
	}
	if (label === "MapConfig") {
		button.setDisabled(true);
	}
	if (label === "MapAura") {
		button.setDisabled(gameMap.auras.length === 0);
	}
	if (label === "MapTerrain") {
		button.setDisabled(gameMap.terrain.length === 0);
	}
	button.setStyle(style);
	return button;
}

function createButtonRow(gameMap: GameMap, ...labels: MapAction[]): ActionRowBuilder<ButtonBuilder> {
	const actionRow = new ActionRowBuilder<ButtonBuilder>();
	labels.forEach(label => actionRow.addComponents(createButton(gameMap, label, ButtonStyle.Secondary)));
	return actionRow;
}

function createMapComponents(gameMap: GameMap): ActionRowBuilder<ButtonBuilder>[] {
	return [
		createButtonRow(gameMap, "MapUpLeft", "MapUp", "MapUpRight", "MapTerrain", "MapRaise"),
		createButtonRow(gameMap, "MapLeft", "MapConfig", "MapRight", "MapAura", "MapDelete"),
		createButtonRow(gameMap, "MapDownLeft", "MapDown", "MapDownRight", "MapToken", "MapLower")
	];
}

/** tests to see if the failure means we should remove the image to avoid future errors, such as a 404 */
// function shouldRemove(_imageUrl: string, err?: any): boolean {
// 	return isErrorLike(err, "remote source rejected with status code 404");
// }

export type RenderMapResults = {
	/** invalidMessageOrChannel or invalidImagesRemoved are true */
	hasError: boolean;
	invalidMessageOrChannel?: boolean;
	invalidImagesRemoved?: boolean;
	/** the map was rendered */
	rendered?: boolean;
	/** the map file was saved */
	saved?: boolean;
	/** render and saved are true and hasError is false */
	success: boolean;
};

/** Attempts to render the given map. If render was successful, GameMap.save() is returned. */
export async function renderMap(messageOrChannel: Optional<Message | SupportedTarget>, gameMap: GameMap): Promise<RenderMapResults> {
	if (!messageOrChannel) {
		return {
			hasError: true,
			invalidMessageOrChannel: true,
			rendered: false,
			success: false,
		};
	}

	const { buffer, response } = await gameMap.toRenderable().renderWithResponse();

	let invalidImagesRemoved = false;
	let rendered = false;
	let saved = false;

	// consider using the following array for removing images instead of all invalidImages
	// const invalidImageUrlsToRemove = response?.invalidImageUrls?.filter(shouldRemove);
	if (response?.invalidImageUrls.length) {
		invalidImagesRemoved = gameMap.removeInvalidImages(response.invalidImageUrls);
	}

	if (buffer) {
		const content = `**${gameMap.name}**`;
		const files = [buffer];
		const components = createMapComponents(gameMap);
		const message = messageOrChannel instanceof Message
			? await messageOrChannel.edit({ content, files, components }).catch(errorReturnUndefined)
			: await messageOrChannel.send({ content, files, components }).catch(errorReturnUndefined);
		if (message) {
			rendered = true;
			gameMap.messageId = message.id as Snowflake;
		}
	}

	if (invalidImagesRemoved || rendered) {
		saved = await gameMap.save();
	}

	return {
		hasError: invalidImagesRemoved,
		invalidImagesRemoved,
		rendered,
		saved,
		success: !invalidImagesRemoved && rendered && saved,
	};
}