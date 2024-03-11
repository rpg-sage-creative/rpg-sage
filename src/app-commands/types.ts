import type {
	SlashCommandAttachmentOption,
	SlashCommandBooleanOption,
	SlashCommandBuilder,
	SlashCommandNumberOption,
	SlashCommandStringOption,
	SlashCommandSubcommandBuilder,
	SlashCommandSubcommandGroupBuilder
} from "@discordjs/builders";
import type { BotCodeName } from "@rsc-utils/env-utils";

export type SlashCommandGameType = "PF1E" | "PF2E" | "SF" | "Finder";

export type SlashCommandChoice = string | [string, string] | { name:string; description?:string; value?:string; };

export type NameAndDescription = { name:string; description?:string; };

export type SlashCommandOption = NameAndDescription & {
	/** Selectable choices for an option. */
	choices?: SlashCommandChoice[];
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

export type SlashCommand = NameAndDescription & {
	/** Subcommands for this command group */
	children?: SlashCommand[];
	/** Options for this command */
	options?: SlashCommandOption[];
	/** Game engine for this command */
	game?: SlashCommandGameType;
};

export type Builder = SlashCommandBuilder | SlashCommandSubcommandBuilder | SlashCommandSubcommandGroupBuilder;
export type BuilderCommand = SlashCommandBuilder | SlashCommandSubcommandBuilder;
export type BuilderOption = SlashCommandAttachmentOption | SlashCommandBooleanOption | SlashCommandNumberOption | SlashCommandStringOption;
export type BuilderOrOption = Builder | BuilderOption;

export type BotCore = {
	/** bot codename: dev, beta, stable */
	codeName: BotCodeName;

	/** bot id / snowflake */
	did: string;

	/** Discord API bot token */
	token: string;
};