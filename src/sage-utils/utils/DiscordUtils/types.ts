import type { ButtonInteraction, CommandInteraction, DMChannel, Guild, GuildPreview, If, Message, MessageComponentInteraction, MessageReaction, PartialDMChannel, PartialMessage, PartialMessageReaction, PartialUser, Role, SelectMenuInteraction, Snowflake, TextChannel, ThreadChannel, User } from "discord.js";

export type DInteraction = CommandInteraction | ButtonInteraction | SelectMenuInteraction | MessageComponentInteraction;

export type DReaction = MessageReaction | PartialMessageReaction;

/** Discord User or Partial User */
export type DUser = User | PartialUser;
export type DUserResolvable = DUser | Snowflake;

/** Guild or Guild Snowflake */
export type DGuildResolvable = Guild | GuildPreview | Snowflake;

export type DRoleResolvable = Role | Snowflake;

/** Text Channel */
export type DThreadChannel = ThreadChannel & { type: "GUILD_PRIVATE_THREAD" | "GUILD_PUBLIC_THREAD"; }
export type DTextChannel = TextChannel & { type: "GUILD_TEXT"; }
export type DGuildChannel = DThreadChannel | DTextChannel;

/** This allows us to update which channels have webhooks later. */
export type DWebhookChannel = DTextChannel;

export type DDMChannel = DMChannel | PartialDMChannel;

export type DChannel = DGuildChannel | DDMChannel;

/** Text Channel or Channel Snowflake */
export type DChannelResolvable = DChannel | Snowflake;

/** Discord Message or Partial Message */
export type DMessageCache<Cached extends boolean = boolean> = Message<Cached> & If<Cached, { channel:DGuildChannel; }, { channel:DDMChannel; }>;
export type DMessagePartial = PartialMessage & { channel:DChannel; }
export type DMessage<Cached extends boolean = boolean> = DMessageCache<Cached> | DMessagePartial;
