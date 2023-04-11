import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";

/** Adds a Short style TextInput to the given modal. */
export function addShortText(modal: ModalBuilder, required = false): TextInputBuilder {
	const index = modal.components.length;
	const row = new ActionRowBuilder<TextInputBuilder>();
	const input = new TextInputBuilder();
	input.setStyle(TextInputStyle.Short).setCustomId(`field-${index}`).setRequired(required);
	row.addComponents(input);
	modal.addComponents(row);
	return input;
}

/** Adds a Paragraph style TextInput to the given modal. */
export function addParagraph(modal: ModalBuilder, required = false): TextInputBuilder {
	return addShortText(modal, required).setStyle(TextInputStyle.Paragraph)
}
