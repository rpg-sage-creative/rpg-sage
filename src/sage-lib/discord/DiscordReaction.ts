// import * as Discord from "discord.js";
// // import type { OrNull } from "../../sage-utils"
// import type { OrNull } from "../../sage-utils";
// // import type { THandlerCachesCore } from "./HandlerCaches";
// import { ReactionType } from "./enums"
// // import { HandlerCaches } from "./HandlerCaches";

// export type TDiscordReactionCore<T extends THandlerCachesCore> = {
// 	caches: HandlerCaches<T>;
// 	// command?: string;
// 	reactionType: ReactionType;
// 	messageReaction: Discord.MessageReaction;
// 	user: Discord.User | Discord.PartialUser;
// };

// export type TDiscordReaction = DiscordReaction<THandlerCachesCore, TDiscordReactionCore<THandlerCachesCore>>;

// export class DiscordReaction<T extends THandlerCachesCore, U extends TDiscordReactionCore<T>> {

// 	public constructor(protected core: U) { }

// 	public get caches(): HandlerCaches<T> {
// 		return this.core.caches;
// 	}

// 	public command: OrNull<string> = null;

// 	public get isAdd(): boolean {
// 		return this.core.reactionType === ReactionType.Add;
// 	}

// 	public get isRemove(): boolean {
// 		return this.core.reactionType === ReactionType.Remove;
// 	}

// 	/** Returns the message */
// 	public get messageReaction(): Discord.MessageReaction {
// 		return this.core.messageReaction;
// 	}

// 	public get user(): Discord.User | Discord.PartialUser {
// 		return this.core.user;
// 	}

// 	/** Create a new DiscordMessage from the core. */
// 	public clone(): DiscordReaction<T, U> {
// 		const constructor = DiscordReaction.DefaultDiscordReaction ?? DiscordReaction;
// 		return new constructor<T, U>(this.core);
// 	}

// 	public static async fromMessageReaction<T extends THandlerCachesCore, U extends TDiscordReactionCore<T>>(messageReaction: Discord.MessageReaction, user: Discord.User | Discord.PartialUser, reactionType: ReactionType): Promise<DiscordReaction<T, U>> {
// 		const caches = HandlerCaches.fromMessageReaction(messageReaction, user);
// 		const constructor = DiscordReaction.DefaultDiscordReaction ?? DiscordReaction;
// 		return new constructor<T, U>(<U>{ caches, messageReaction, reactionType, user });
// 	}

// 	public static DefaultDiscordReaction: typeof DiscordReaction;

// }

// export default DiscordReaction;