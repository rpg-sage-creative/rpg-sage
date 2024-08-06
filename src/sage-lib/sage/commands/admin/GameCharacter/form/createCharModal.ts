import { isNilSnowflake, type Snowflake } from "@rsc-utils/core-utils";
import { DiscordMaxValues, ModalBuilder } from "@rsc-utils/discord-utils";
import { createCustomId } from "./customId.js";
import type { CharId, CharModalAction } from "./types.js";

type CharModalData = {
	// indicator: string;
	userId: Snowflake;
	charId: CharId;
	compId: CharId;
	action: CharModalAction;
	fields: [string, string, string, (number | "P")?, boolean?][];
}

export function createCharModal(modalData: CharModalData): ModalBuilder {
	const modal = new ModalBuilder();
	modal.setTitle(isNilSnowflake(modalData.charId) ? "Create Character" : "Edit Character");
	modal.setCustomId(createCustomId(modalData));
	modalData.fields.forEach(field => {
		const [customId, label, value, maxLength, required] = field;
		const input = maxLength === "P"
			? modal.addParagraph({ required })
			: modal.addShortText({ maxLength, required });
		input.setCustomId(customId)
			.setLabel(label.slice(0, DiscordMaxValues.modal.field.labelLength))
			.setValue(value.slice(0, DiscordMaxValues.modal.field.valueLength) ?? "");
	});
	return modal;
}