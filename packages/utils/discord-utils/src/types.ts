import type { AutocompleteInteraction, ButtonInteraction, CacheType, CommandInteraction, DMChannel, ForumChannel, Guild, GuildPreview, If, Message, MessageComponentInteraction, MessageReaction, ModalSubmitInteraction, PartialDMChannel, PartialMessage, PartialMessageReaction, PartialUser, Role, SelectMenuInteraction, Snowflake, TextChannel, ThreadChannel, User, VoiceChannel } from "discord.js";

export type DInteraction<Cached extends CacheType = CacheType>
	= ButtonInteraction<Cached> // button
	| SelectMenuInteraction<Cached> // select
	| MessageComponentInteraction<Cached> // button or select or text
	| AutocompleteInteraction<Cached> // autocomplete
	| CommandInteraction<Cached> // slash
	| ModalSubmitInteraction<Cached> // modal
	;
export type DRepliableInteraction<Cached extends CacheType = CacheType>
	= ButtonInteraction<Cached>
	| SelectMenuInteraction<Cached>
	| MessageComponentInteraction<Cached>
	| CommandInteraction<Cached>
	| ModalSubmitInteraction<Cached>
	;

export type DReaction = MessageReaction | PartialMessageReaction;

/** Discord User or Partial User */
export type DUser = User | PartialUser;
export type DUserResolvable = DUser | Snowflake;

/** Guild or Guild Snowflake */
export type DGuildResolvable = Guild | GuildPreview | Snowflake;

export type DRoleResolvable = Role | Snowflake;

export type DDMChannel = DMChannel | PartialDMChannel;

export type DForumChannel = ForumChannel & { type: "GUILD_FORUM"; };
export type DTextChannel = TextChannel & { type: "GUILD_TEXT"; };
export type DThreadChannel = ThreadChannel & {
	type: "GUILD_PUBLIC_THREAD" | "GUILD_PRIVATE_THREAD";
	parent: DTextChannel | DForumChannel;
};
// export type DForumChannel = ForumChannel & { type: ChannelType.GuildForum; };
// export type DTextChannel = TextChannel & { type: ChannelType.GuildText; };
// export type DThreadChannel = ThreadChannel & { type: ChannelType.PublicThread | ChannelType.PrivateThread; };
export type DVoiceChannel = VoiceChannel & { type: "GUILD_VOICE"; };

export type DGuildChannel = DForumChannel | DTextChannel | DThreadChannel;
export type DWebhookChannel = DTextChannel | DForumChannel;

export type DMessageChannel = DTextChannel | DThreadChannel | DDMChannel;

export type DChannel = DGuildChannel | DDMChannel;

export type DMessageTarget = DMessageChannel | DUser;

/** Text Channel or Channel Snowflake */
export type DChannelResolvable = DChannel | Snowflake;

/** Discord Message or Partial Message */
export type DMessageCache<Cached extends boolean = boolean> = Message<Cached> & If<Cached, { channel:DMessageChannel; }, { channel:DDMChannel; }>;
export type DMessagePartial = PartialMessage & { channel:DMessageChannel; };
export type DMessage<Cached extends boolean = boolean> = DMessageCache<Cached> | DMessagePartial;