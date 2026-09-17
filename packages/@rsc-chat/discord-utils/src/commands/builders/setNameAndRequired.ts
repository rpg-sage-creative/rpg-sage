import type { BuilderOption, SlashCommandOption } from "../index.js";
import { setName } from "./setName.js";

/** Expanded setName that also calls setRequired. */
export function setNameAndRequired<T extends BuilderOption>(opt: T, option: SlashCommandOption): T {
	setName(opt, option);
	opt.setRequired(option.isRequired === true);
	return opt;
}