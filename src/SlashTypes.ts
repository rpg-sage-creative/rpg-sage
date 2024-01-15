export type SlashCommandGameType = "PF1E" | "PF2E" | "SF" | "Finder";

export type TSlashCommandChoice = string | [string, string] | { name:string; description?:string; value?:string; };

export type TNameDescription = { name:string; description?:string; };

export type TSlashCommandOption = TNameDescription & {
	/** Selectable choices for an option. */
	choices?: TSlashCommandChoice[];
	/** Flag for attachment */
	isAttachment?: boolean;
	/** Flag for boolean type */
	isBoolean?: boolean;
	/** Flag for number type */
	isNumber?: boolean;
	/** Flag for setRequired */
	isRequired?: boolean;
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
	game?: SlashCommandGameType;
};
