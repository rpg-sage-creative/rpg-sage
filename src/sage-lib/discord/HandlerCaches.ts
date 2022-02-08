// import * as Discord from "discord.js";
// // import type { Awaitable, OrNull } from "../../sage-utils"
// // import utils from "../../sage-utils"
// import utils from "../../sage-utils";
// import DiscordCache from "./DiscordCache"
// import ChannelKey from "./ChannelKey";
// import MessageKey from "./MessageKey";
// import { NilSnowflake } from "./consts";

// type TMeta = {
// 	messagesDeleted?: Discord.Message[];
// 	messagesSent?: Discord.Message[];
// };

// export type THandlerCachesCore = {
// 	channelKey: ChannelKey;
// 	messageKey: MessageKey | null;
// 	discord: DiscordCache;
// 	discordUser: Discord.User | Discord.PartialUser | null;
// }

// export type THandlerCaches = HandlerCaches<THandlerCachesCore>;

// export class HandlerCaches<T extends THandlerCachesCore> {

// 	public constructor(protected core: T) { }

// 	public get channelKey(): ChannelKey {
// 		return this.core.channelKey;
// 	}

// 	public get discord(): DiscordCache {
// 		return this.core.discord;
// 	}

// 	public get messageKey(): MessageKey | null {
// 		return this.core.messageKey ?? null;
// 	}

// 	public get userDid(): Discord.Snowflake {
// 		return this.core.discordUser?.id ?? NilSnowflake;
// 	}

// 	public meta: TMeta[] = [];

// 	/** Used to ensure clones use the correct constructor. */
// 	protected clone(core: T): HandlerCaches<T> {
// 		return new HandlerCaches(core);
// 	}

// 	public cloneForChannel(channel: Discord.TextBasedChannels | Discord.BaseGuildTextChannel): HandlerCaches<T> {
// 		const core = { ...this.core };
// 		core.channelKey = ChannelKey.fromChannel(channel);
// 		core.messageKey = null;
// 		return this.clone(core);
// 	}

// 	public cloneForMessage(message: Discord.Message | Discord.PartialMessage): HandlerCaches<T> {
// 		const core = { ...this.core };
// 		core.messageKey = MessageKey.fromMessage(message);
// 		core.channelKey = core.messageKey.channelKey;
// 		return this.clone(core);
// 	}

// 	public emojify(content: string): string {
// 		return content;
// 	}

// 	public format(content: string): string {
// 		return utils.StringUtils.Markdown.format(content);
// 	}

// 	protected static create(core: THandlerCachesCore): HandlerCaches<THandlerCachesCore> {
// 		return new HandlerCaches(core);
// 	}

// 	public static fromMessage(message: Discord.Message | Discord.PartialMessage): Discord.Awaitable<HandlerCaches<THandlerCachesCore>> {
// 		const messageKey = MessageKey.fromMessage(message);
// 		const channelKey = messageKey.channelKey;
// 		const discord = DiscordCache.fromMessage(message);
// 		const discordUser = message.author;
// 		return this.create({ messageKey, channelKey, discord, discordUser });
// 	}

// 	public static fromMessageReaction(messageReaction: Discord.MessageReaction, discordUser: Discord.User | Discord.PartialUser): Discord.Awaitable<HandlerCaches<THandlerCachesCore>> {
// 		const messageKey = MessageKey.fromMessageReaction(messageReaction);
// 		const channelKey = messageKey.channelKey;
// 		const discord = DiscordCache.fromMessageReaction(messageReaction);
// 		return this.create({ messageKey, channelKey, discord, discordUser });
// 	}

// }

// export default HandlerCaches;