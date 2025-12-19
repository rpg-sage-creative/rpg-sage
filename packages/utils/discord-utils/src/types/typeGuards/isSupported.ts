import type { Optional, Snowflake } from "@rsc-utils/core-utils";
import type { AutocompleteInteraction, ButtonInteraction, CacheType, CategoryChannel, Channel, ChannelSelectMenuInteraction, ChannelType, ChatInputCommandInteraction, DMChannel, ForumChannel, Interaction, MentionableSelectMenuInteraction, Message, MessageContextMenuCommandInteraction, ModalSubmitInteraction, PartialUser, PrimaryEntryPointCommandInteraction, PrivateThreadChannel, PublicThreadChannel, RoleSelectMenuInteraction, StringSelectMenuInteraction, TextChannel, User, UserContextMenuCommandInteraction, UserSelectMenuInteraction, VoiceChannel } from "discord.js";

export type SupportedCategoryChannel = CategoryChannel & { id:Snowflake; };
export type SupportedDMChannel = DMChannel & { id:Snowflake; };
export type SupportedForumChannel = ForumChannel & { id:Snowflake; parent:CategoryChannel | null; };
export type SupportedTextChannel = TextChannel & { id:Snowflake; parent:CategoryChannel | null; };
export type SupportedVoiceChannel = VoiceChannel & { id:Snowflake; parent:CategoryChannel | null; };
export type SupportedPrivateThreadChannel = PrivateThreadChannel & { id:Snowflake; parent: SupportedForumChannel | SupportedTextChannel | null; };
export type SupportedPublicThreadChannel<Forum extends boolean = boolean> = PublicThreadChannel<Forum> & { id:Snowflake; parent: SupportedForumChannel | SupportedTextChannel; type:ChannelType.PublicThread; };

export type HasSupportedParentChannel = SupportedChannel & { id:Snowflake; parent: SupportedParentChannel; };
export function hasSupportedParentChannel(channel: Optional<Channel | User | PartialUser>): channel is HasSupportedParentChannel {
	if (!channel || !("parent" in channel) || !channel.parent) return false;
	return isSupportedParentChannel(channel.parent);
}

/** All valid parent "Channels" for Channels Sage can be active in. */
export type SupportedParentChannel = SupportedCategoryChannel | SupportedForumChannel | SupportedTextChannel;
export function isSupportedParentChannel(channel: Optional<Channel | User | PartialUser>): channel is SupportedParentChannel {
	if (!channel || !("type" in channel)) return false;
	switch(channel.type) {
		case 0: return !channel.parent || isSupportedParentChannel(channel.parent);  // ChannelType.GuildText
		case 4: return true;                                                         // ChannelType.GuildCategory
		case 15: return !channel.parent || isSupportedParentChannel(channel.parent); // ChannelType.GuildForum
		default: return false;
	}
}

/** All Text Channels Sage can be active in. */
export type SupportedChannel = SupportedDMChannel | SupportedForumChannel | SupportedPrivateThreadChannel | SupportedPublicThreadChannel | SupportedTextChannel | SupportedVoiceChannel;
export function isSupportedChannel(channel: Optional<Channel | User | PartialUser>): channel is SupportedChannel {
	if (!channel || !("type" in channel)) return false;
	switch(channel.type) {
		case 0: return !channel.parent || isSupportedParentChannel(channel.parent);  // ChannelType.GuildText
		case 1: return true;                                                         // ChannelType.DM
		case 2: return !channel.parent || isSupportedParentChannel(channel.parent);  // ChannelType.GuildVoice
		case 11: return isSupportedParentChannel(channel.parent);                    // ChannelType.PublicThread
		case 12: return isSupportedParentChannel(channel.parent);                    // ChannelType.PrivateThread
		case 15: return !channel.parent || isSupportedParentChannel(channel.parent); // ChannelType.GuildForum
		default: return false;
	}
}

/** All Channels Sage can be active in. */
export type SupportedChannelOrParent = SupportedChannel | SupportedParentChannel;
export function isSupportedChannelOrParent(channel: Optional<Channel | User | PartialUser>): channel is SupportedChannelOrParent {
	return isSupportedChannel(channel) || isSupportedParentChannel(channel);
}

/** NonThread Channels Sage can be active in. */
export type SupportedNonThreadChannel = SupportedDMChannel | SupportedForumChannel | SupportedTextChannel | SupportedVoiceChannel;
export function isSupportedNonThreadChannel(channel: Optional<Channel | User | PartialUser>): channel is SupportedNonThreadChannel {
	return isSupportedChannel(channel) && !channel.isThread();
}

/** Thread Channels Sage can be active in. */
export type SupportedThreadChannel = SupportedPrivateThreadChannel | SupportedPublicThreadChannel;
export function isSupportedThreadChannel(channel: Optional<Channel | User | PartialUser>): channel is SupportedThreadChannel {
	return isSupportedChannel(channel) && channel.isThread();
}

/** Channels with Messages (.messages) Sage can be active in. */
export type SupportedMessagesChannel = SupportedDMChannel | SupportedPrivateThreadChannel | SupportedPublicThreadChannel | SupportedTextChannel | SupportedVoiceChannel;
export function isSupportedMessagesChannel(channel: Optional<Channel | User | PartialUser>): channel is SupportedMessagesChannel {
	return isSupportedChannel(channel) && "messages" in channel;
}

/** Game (non DM) Channels Sage can be active in. */
export type SupportedGameChannel = SupportedForumChannel | SupportedPrivateThreadChannel | SupportedPublicThreadChannel | SupportedTextChannel | SupportedVoiceChannel;
export function isSupportedGameChannel(channel: Optional<Channel | User | PartialUser>): channel is SupportedGameChannel {
	return isSupportedChannel(channel) && !channel.isDMBased();
}

/** Game (non DM) Channels with Messages (.messages) Sage can be active in. */
export type SupportedGameMessagesChannel = SupportedPrivateThreadChannel | SupportedPublicThreadChannel | SupportedTextChannel | SupportedVoiceChannel;
export function isSupportedGameMessagesChannel(channel: Optional<Channel | User | PartialUser>): channel is SupportedGameMessagesChannel {
	return isSupportedChannel(channel) && !channel.isDMBased() && "messages" in channel;
}

/** Channels with Webhooks (.fetchWebhooks) Sage can be active in. */
export type SupportedWebhookChannel = SupportedForumChannel | SupportedTextChannel | SupportedVoiceChannel;
export function isSupportedWebhookChannel(channel: Optional<Channel | User | PartialUser>): channel is SupportedWebhookChannel {
	return isSupportedChannel(channel) && "fetchWebhooks" in channel;
}

export type SupportedTarget = SupportedMessagesChannel | User;
export function isSupportedTarget(target: Optional<Channel | User | PartialUser>): target is SupportedTarget {
	if (!target) return false;
	if ("type" in target) return isSupportedMessagesChannel(target);
	return !target.partial;
}

export type MightHaveChannel = { channel: SupportedMessagesChannel | null; };
export type MightHaveMessage = { message: Message & { channel:SupportedMessagesChannel | null; } | null; };
export type HasMessage = { message: Message & { channel:SupportedMessagesChannel | null; }; };
export type HasTargetMessage = { targetMessage: Message & { channel:SupportedMessagesChannel | null; }; };

export type SupportedSlashCommandInteraction = ChatInputCommandInteraction & MightHaveChannel;

export type SupportedMessageContextInteraction<Cached extends CacheType = CacheType> = MessageContextMenuCommandInteraction<Cached> & MightHaveChannel & HasTargetMessage;
export type SupportedUserContextInteraction<Cached extends CacheType = CacheType> = UserContextMenuCommandInteraction<Cached> & MightHaveChannel;

export type SupportedChannelSelectInteraction<Cached extends CacheType = CacheType> = ChannelSelectMenuInteraction<Cached> & MightHaveChannel & HasMessage;
export type SupportedMentionableSelectInteraction<Cached extends CacheType = CacheType> = MentionableSelectMenuInteraction<Cached> & MightHaveChannel & HasMessage;
// export type SupportedMessageComponentInteraction<Cached extends CacheType = CacheType> = MessageComponentInteraction<Cached> & MightHaveChannel & HasMessage;
export type SupportedRoleSelectInteraction<Cached extends CacheType = CacheType> = RoleSelectMenuInteraction<Cached> & MightHaveChannel & HasMessage;
export type SupportedStringSelectInteraction<Cached extends CacheType = CacheType> = StringSelectMenuInteraction<Cached> & MightHaveChannel & HasMessage;
export type SupportedUserSelectInteraction<Cached extends CacheType = CacheType> = UserSelectMenuInteraction<Cached> & MightHaveChannel & HasMessage;

export type SupportedButtonInteraction<Cached extends CacheType = CacheType> = ButtonInteraction<Cached> & MightHaveChannel & HasMessage;

export type SupportedAutocompleteInteraction<Cached extends CacheType = CacheType> = AutocompleteInteraction<Cached> & MightHaveChannel;

export type SupportedModalSubmitInteraction<Cached extends CacheType = CacheType> = ModalSubmitInteraction<Cached> & MightHaveChannel & MightHaveMessage;

export type SupportedEntryPointInteraction<Cached extends CacheType = CacheType> = PrimaryEntryPointCommandInteraction<Cached> & MightHaveChannel;

export type SupportedInteraction<Cached extends CacheType = CacheType> = SupportedSlashCommandInteraction
	| SupportedMessageContextInteraction<Cached> | SupportedUserContextInteraction<Cached>
	| SupportedChannelSelectInteraction<Cached> | SupportedMentionableSelectInteraction<Cached>
		// | SupportedMessageComponentInteraction<Cached>
		| SupportedRoleSelectInteraction<Cached> | SupportedStringSelectInteraction<Cached> | SupportedUserSelectInteraction<Cached>
	| SupportedButtonInteraction<Cached>
	| SupportedAutocompleteInteraction<Cached>
	| SupportedModalSubmitInteraction<Cached>
	| SupportedEntryPointInteraction<Cached>;
export function isSupportedInteraction(interaction: Optional<Interaction>): interaction is SupportedInteraction {
	if (!interaction) return false;

	// all need a valid channel
	if (interaction.channel && !isSupportedChannel(interaction.channel)) return false;

	// message context needs targetMessage to have a valid channel
	if ("targetMessage" in interaction && !isSupportedChannel(interaction.targetMessage.channel)) return false;

	// select / button / modal need message to have a valid channel
	if ("message" in interaction && interaction.message && !isSupportedChannel(interaction.message.channel)) return false;

	// otherwise ...
	return true;
}

export type SupportedRepliableInteraction<Cached extends CacheType = CacheType> = Exclude<SupportedInteraction<Cached>, SupportedAutocompleteInteraction>;
export function isSupportedRepliableInteraction(interaction: Optional<Interaction>): interaction is SupportedRepliableInteraction {
	return isSupportedInteraction(interaction) && interaction.isRepliable();
}