import type { BuilderCommand, SlashCommandOption } from "../types.js";
import { setMinMaxValues } from "./setMinMaxValues.js";
import { setNameAndRequired } from "./setNameAndRequired.js";
import { toChoice } from "./toChoice.js";

/** shortcut for setting options all things that allow options */
export function addOptions<T extends BuilderCommand>(builder: T, options?: SlashCommandOption[]): T {
	options?.forEach(option => {
		if (option.isBoolean) {
			builder.addBooleanOption(opt => setNameAndRequired(opt, option));
		}else if (option.isNumber) {
			builder.addNumberOption(opt => {
				setNameAndRequired(opt, option);
				setMinMaxValues(opt, option);
				return opt;
			});
		}else if (option.isAttachment) {
			builder.addAttachmentOption(opt => {
				setNameAndRequired(opt, option);
				return opt;
			});
		}else {
			builder.addStringOption(opt => {
				setNameAndRequired(opt, option);
				option.choices?.forEach(choice => {
					opt.addChoices(toChoice(choice));
				});
				return opt;
			});
		}
		return builder;
	}
	);
	return builder;
}