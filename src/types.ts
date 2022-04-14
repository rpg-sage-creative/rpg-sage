import type { TGameType } from "./slash.mjs";

export type TSlashCommandChoice = string | [string, string] | { name:string; description?:string; value?:string; };
export type TNameDescription = { name:string; description?:string; };
export type TSlashCommandOption = TNameDescription & {
	/** Selectable choices for an option. */
	choices?: TSlashCommandChoice[];
	/** Flag for setRequired */
	isRequired?: boolean;
	/** Flag for boolean type */
	isBoolean?: boolean;
	/** Flag for number type */
	isNumber?: boolean;
	/** Value for setMinValue if number type */
	minValue?: number;
	/** Value for setMaxValue if number type */
	maxValue?: number;
};
export type TSlashCommand = TNameDescription & {
	/** Subcommands for this command group */
	children?: TSlashCommand[];
	/** Options for this command */
	options?: TSlashCommandOption[];
	/** Game engine for this command */
	game?: TGameType;
};
