import type { Optional } from "@rsc-utils/core-utils";
import { ChannelType, type AnyThreadChannel, type CategoryChannel, type Channel, type ForumChannel, type TextChannel } from "discord.js";
import type { UserOrPartial } from "../types.js";

/** These are the only channels Sage should function in. */
export type GameChannel = TextChannel | AnyThreadChannel | ForumChannel | CategoryChannel;

export function isGameChannel(channel?: Optional<Channel | UserOrPartial>): channel is GameChannel {
	if (channel && "isThread" in channel) {
		return channel.type === ChannelType.GuildText
			|| channel.type === ChannelType.GuildCategory
			|| channel.type === ChannelType.GuildForum
			|| channel.type === ChannelType.PublicThread
			|| channel.type === ChannelType.PrivateThread;
	}
	return false;
}