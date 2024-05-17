import type { SlashCommandIntegerOption, SlashCommandNumberOption } from "@discordjs/builders";
import { isValidNumber } from "@rsc-utils/number-utils";
import type { SlashCommandOption } from "../types.js";

export function setMinMaxValues<T extends SlashCommandIntegerOption | SlashCommandNumberOption>(opt: T, option: SlashCommandOption): T {
	if (isValidNumber(option.minValue)) {
		opt.setMinValue(option.minValue);
	}
	if (isValidNumber(option.maxValue)) {
		opt.setMaxValue(option.maxValue);
	}
	return opt;
}