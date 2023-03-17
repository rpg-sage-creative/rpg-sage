import type { ButtonInteraction, ChannelType, DMChannel, ForumChannel, Guild, GuildPreview, If, Message, MessageComponentInteraction, MessageReaction, PartialDMChannel, PartialMessage, PartialMessageReaction, PartialUser, Role, StringSelectMenuInteraction, Snowflake, TextChannel, ThreadChannel, User, ChatInputCommandInteraction } from "discord.js";
import type { Optional } from "../..";
import type { TMatcher } from "../types";

export type DInteraction = ChatInputCommandInteraction | ButtonInteraction | StringSelectMenuInteraction | MessageComponentInteraction;

export type DReaction = MessageReaction | PartialMessageReaction;

/** Discord User or Partial User */
export type DUser = User | PartialUser;
export type DUserResolvable = DUser | Snowflake;

/** Guild or Guild Snowflake */
export type DGuildResolvable = Guild | GuildPreview | Snowflake;

export type DRoleResolvable = Role | Snowflake;

/** Text Channel */
export type DForumChannel = ForumChannel & { type: ChannelType.GuildForum; };
export type DTextChannel = TextChannel & { type: ChannelType.GuildText; }
export type DThreadChannel = ThreadChannel & { type: ChannelType.PublicThread | ChannelType.PrivateThread; }
export type DGuildChannel = DTextChannel | DThreadChannel;

/** This allows us to update which channels have webhooks later. */
export type DWebhookChannel = DTextChannel | DForumChannel;

export type DDMChannel = DMChannel | PartialDMChannel;

export type DChannel = DGuildChannel | DDMChannel;

/** Text Channel or Channel Snowflake */
export type DChannelResolvable = DChannel | Snowflake;

/** Discord Message or Partial Message */
export type DMessageCache<Cached extends boolean = boolean> = Message<Cached> & If<Cached, { channel:DGuildChannel; }, { channel:DDMChannel; }>;
export type DMessagePartial = PartialMessage & { channel:DChannel; }
export type DMessage<Cached extends boolean = boolean> = DMessageCache<Cached> | DMessagePartial;

//#endregion SnowflakeMatcher

/** Contains all the properties that represent a TSnowflakeMatcher. */
export type TSnowflakeMatcher = TMatcher & {
	/** Stores isNonNilSnowflake */
	isNonNil: boolean;
	/** Stores isSnowflake(value) */
	isValid: boolean;
	/** Stores the raw value. */
	value: Snowflake;
}

/** Convenience type for Snowflake | TSnowflakeMatcher */
export type TSnowflakeMatcherResolvable = Optional<Snowflake> | TSnowflakeMatcher;

//#endregion
