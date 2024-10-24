import { errorReturnNull, type Optional, type Snowflake } from "@rsc-utils/core-utils";
import type { MessageTarget } from "@rsc-utils/discord-utils";
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

export async function renderMap(messageOrChannel: Optional<Message | MessageTarget>, gameMap: GameMap): Promise<boolean> {
	if (!messageOrChannel) {
		return false;
	}
	const buffer = await gameMap.toRenderable().render();
	if (buffer) {
		const content = `**${gameMap.name}**`;
		const files = [buffer];
		const components = createMapComponents(gameMap);
		const message = messageOrChannel instanceof Message
			? await messageOrChannel.edit({ content, files, components }).catch(errorReturnNull)
			: await messageOrChannel.send({ content, files, components }).catch(errorReturnNull);
		if (message) {
			gameMap.messageId = message.id as Snowflake;
			return gameMap.save();
		}
	}
	return false;
}