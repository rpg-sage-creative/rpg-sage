import type {
	SlashCommandAttachmentOption,
	SlashCommandBooleanOption,
	SlashCommandBuilder,
	SlashCommandChannelOption,
	SlashCommandIntegerOption,
	SlashCommandMentionableOption,
	SlashCommandNumberOption,
	SlashCommandRoleOption,
	SlashCommandStringOption,
	SlashCommandSubcommandBuilder,
	SlashCommandSubcommandGroupBuilder,
	SlashCommandUserOption
} from "@discordjs/builders";

export type SlashCommandChoice<T = string | number> = T | [string, T] | { name:string; description?:string; value?:T; };

export type NameAndDescription = { name:string; description?:string; };

export type SlashCommandOption<T extends string | number = any> = NameAndDescription & {
	/** Selectable choices for an option. */
	choices?: T extends string | number ? SlashCommandChoice<T>[] : never;
	/** Flag for attachment */
	isAttachment?: boolean;
	/** Flag for boolean type */
	isBoolean?: boolean;
	isChannel?: boolean;
	isInteger?: boolean;
	isMentionable?: boolean;
	/** Flag for number type */
	isNumber?: boolean;
	/** Flag for setRequired */
	isRequired?: boolean;
	isRole?: boolean;
	isUser?: boolean;
	/** Value for setMinValue if number type */
	minValue?: number;
	/** Value for setMaxValue if number type */
	maxValue?: number;
};

export type SlashCommand<T extends string | number = any> = NameAndDescription & {
	/** Subcommands for this command group */
	children?: SlashCommand[];
	/** Options for this command */
	options?: SlashCommandOption<T>[];
	/** Game engine for this command */
	game?: string;
};

export type GameSlashCommand<Game extends string, T extends string | number = any> = SlashCommand<T> & {
	/** Game engine for this command */
	game: Game;
};

export type MessageCommand = { name:string; type:3; };
export type UserCommand = { name:string; type:2; };
export type ContextCommand = MessageCommand | UserCommand;

export type Builder = SlashCommandBuilder | SlashCommandSubcommandBuilder | SlashCommandSubcommandGroupBuilder;
export type BuilderCommand = SlashCommandBuilder | SlashCommandSubcommandBuilder;
export type BuilderOption = SlashCommandAttachmentOption | SlashCommandBooleanOption | SlashCommandChannelOption | SlashCommandIntegerOption | SlashCommandMentionableOption | SlashCommandNumberOption | SlashCommandRoleOption | SlashCommandStringOption | SlashCommandUserOption;
export type BuilderOrOption = Builder | BuilderOption;
