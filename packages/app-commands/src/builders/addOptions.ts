import type { SlashCommandStringOption } from "discord.js";
import type { BuilderCommand, BuilderOption, SlashCommandOption } from "../index.js";
import { setMinMaxValues } from "./setMinMaxValues.js";
import { setNameAndRequired } from "./setNameAndRequired.js";
import { toChoice } from "./toChoice.js";

type AddHandler<T extends BuilderOption> = (opt: T) => T;

/** shortcut for setting options all things that allow options */
export function addOptions<T extends BuilderCommand>(builder: T, options?: SlashCommandOption[]): T {
	options?.forEach(option => {
		const addHandler: AddHandler<any> = (opt: BuilderOption) => {
			setNameAndRequired(opt, option);
			if ("setMinValue" in opt) setMinMaxValues(opt, option); //NOSONAR
			if ("addChoices" in opt) {
				option.choices?.forEach(choice => {
					(opt as SlashCommandStringOption).addChoices(toChoice<string>(choice));
				});
			}
			return opt;
		};
		if (option.isAttachment) {
			builder.addAttachmentOption(addHandler);
		}else if (option.isBoolean) {
			builder.addBooleanOption(addHandler);
		}else if (option.isChannel) {
			builder.addChannelOption(addHandler);
		}else if (option.isInteger) {
			builder.addIntegerOption(addHandler);
		}else if (option.isMentionable) {
			builder.addMentionableOption(addHandler);
		}else if (option.isNumber) {
			builder.addNumberOption(addHandler);
		}else if (option.isRole) {
			builder.addRoleOption(addHandler);
		}else if (option.isUser) {
			builder.addUserOption(addHandler);
		}else {
			builder.addStringOption(addHandler);
		}
		return builder;
	}
	);
	return builder;
}