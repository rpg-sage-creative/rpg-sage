import type { Optional } from "@rsc-utils/core-utils";
import { ModalBuilder as _ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } from "discord.js";

type Options = {
	maxLength?: number;
	required?: boolean;
};

export class ModalBuilder extends _ModalBuilder {

	public addShortText(): TextInputBuilder;
	public addShortText(required: Optional<boolean>): TextInputBuilder;
	public addShortText(options: Optional<Options>): TextInputBuilder;
	public addShortText(arg?: Optional<boolean | Options>): TextInputBuilder {
		const index = this.components.length;
		const row = new ActionRowBuilder<TextInputBuilder>();
		const input = new TextInputBuilder();
		input.setStyle(TextInputStyle.Short);
		input.setCustomId(`field-${index}`);
		if (arg) {
			if (typeof(arg) === "boolean") {
				input.setRequired(arg === true);
			}else {
				input.setRequired(arg?.required === true);
				if (arg.maxLength) {
					input.setMaxLength(arg.maxLength);
				}
			}
		}
		row.addComponents(input);
		this.addComponents(row);
		return input;
	}

	public addParagraph(): TextInputBuilder;
	public addParagraph(required: Optional<boolean>): TextInputBuilder;
	public addParagraph(options: Optional<Options>): TextInputBuilder;
	public addParagraph(arg?: Optional<boolean | Options>): TextInputBuilder {
		return this.addShortText(arg as Options).setStyle(TextInputStyle.Paragraph);
	}

}