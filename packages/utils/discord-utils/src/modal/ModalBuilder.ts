import { ModalBuilder as _ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } from "discord.js";

export class ModalBuilder extends _ModalBuilder {

	public addShortText(required?: boolean): TextInputBuilder {
		const index = this.components.length;
		const row = new ActionRowBuilder<TextInputBuilder>();
		const input = new TextInputBuilder();
		input.setStyle(TextInputStyle.Short).setCustomId(`field-${index}`).setRequired(required);
		row.addComponents(input);
		this.addComponents(row);
		return input;
	}

	public addParagraph(required?: boolean): TextInputBuilder {
		return this.addShortText(required).setStyle(TextInputStyle.Paragraph);
	}

}