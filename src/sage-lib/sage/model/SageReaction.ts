import type * as Discord from "discord.js";
import { ReactionType } from "../../discord";
import type { HasSageCacheCore } from "./HasSageCache";
import HasSageCache from "./HasSageCache";
import SageCache from "./SageCache";

type DUser = Discord.User | Discord.PartialUser;
type DMessage = Discord.Message | Discord.PartialMessage;
type DReaction = Discord.MessageReaction | Discord.PartialMessageReaction;

interface SageReactionCore extends HasSageCacheCore {
	messageReaction: DReaction;
	user: DUser;
	reactionType: ReactionType;
};

export default class SageReaction
	extends HasSageCache<SageReactionCore, SageReaction> {
	public static async fromMessageReaction(messageReaction: DReaction, user: DUser, reactionType: ReactionType): Promise<SageReaction> {
		const caches = await SageCache.fromMessageReaction(messageReaction, user);
		return new SageReaction({
			caches,
			messageReaction,
			reactionType,
			user
		});
	}
	public get isAdd(): boolean {
		return this.core.reactionType === ReactionType.Add;
	}

	public get isRemove(): boolean {
		return this.core.reactionType === ReactionType.Remove;
	}

	/** Returns the message */
	public get messageReaction(): DReaction {
		return this.core.messageReaction;
	}

	public get user(): DUser {
		return this.core.user;
	}

	public constructor(protected core: SageReactionCore) {
		super(core);
	}

	public get message(): DMessage {
		return this.core.messageReaction.message;
	}


	public clone(): SageReaction {
		return new SageReaction(this.core);
	}

	public command: string | null = null;

}
