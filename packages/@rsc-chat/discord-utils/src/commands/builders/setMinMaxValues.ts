import type { SlashCommandIntegerOption, SlashCommandNumberOption } from "@discordjs/builders";
import { isFiniteNumber } from "@rsc-utils/core-utils";
import type { SlashCommandOption } from "../index.js";

export function setMinMaxValues<T extends SlashCommandIntegerOption | SlashCommandNumberOption>(opt: T, option: SlashCommandOption): T {
	if (isFiniteNumber(option.minValue)) {
		opt.setMinValue(option.minValue);
	}
	if (isFiniteNumber(option.maxValue)) {
		opt.setMaxValue(option.maxValue);
	}
	return opt;
}