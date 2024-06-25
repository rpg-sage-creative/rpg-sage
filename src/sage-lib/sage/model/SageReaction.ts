import { Cache } from "@rsc-utils/cache-utils";
import { debug } from "@rsc-utils/core-utils";
import { type Snowflake } from "@rsc-utils/core-utils";
import { ReactionType } from "../../discord/index.js";
import { GameRoleType } from "./Game.js";
import { SageCache } from "./SageCache.js";
import { SageCommand, type SageCommandCore } from "./SageCommand.js";
import { SageReactionArgs } from "./SageReactionArgs.js";
import type { MessageOrPartial, ReactionOrPartial, UserOrPartial } from "@rsc-utils/discord-utils";

interface SageReactionCore extends SageCommandCore {
	messageReaction: ReactionOrPartial;
	user: UserOrPartial;
	reactionType: ReactionType;
};

export class SageReaction
	extends SageCommand<SageReactionCore, SageReactionArgs> {

	public args: SageReactionArgs;

	public command: string | null = null;

	public isCommand(emoji: string, action: "add" | "remove"): boolean {
		return this.commandValues[0] === emoji
			&& [action, "both"].includes(this.commandValues[1]);
	}

	public commandValues: string[];

	private constructor(protected core: SageReactionCore, cache?: Cache) {
		super(core, cache);
		this.args = new SageReactionArgs(this);
		this.commandValues = [core.messageReaction.emoji.toString(), ReactionType[core.reactionType].toLowerCase()];
	}

	public get isAdd(): boolean {
		return this.core.reactionType === ReactionType.Add;
	}

	public get isRemove(): boolean {
		return this.core.reactionType === ReactionType.Remove;
	}

	/** Returns the message */
	public get messageReaction(): ReactionOrPartial {
		return this.core.messageReaction;
	}

	public get user(): UserOrPartial {
		return this.core.user;
	}

	public get message(): MessageOrPartial {
		return this.core.messageReaction.message;
	}

	/** Returns the channelDid this message (or its thread) is in. */
	public get channelDid(): Snowflake | undefined {
		return this.cache.get("channelDid", () => {
			if (this.message.channel.isThread()) {
				return this.message.channel.parent?.id as Snowflake;
			}
			return this.message.channel.id as Snowflake;
		});
	}

	public clear(): void {
		debug("Clearing SageReaction");
		this.cache.clear();
		this.sageCache.clear();
	}

	public clone(): this {
		return new SageReaction(this.core, this.cache) as this;
	}

	public reply(): Promise<void> { return Promise.resolve(); }

	public whisper(): Promise<void> { return Promise.resolve(); }

	public static async fromMessageReaction(messageReaction: ReactionOrPartial, user: UserOrPartial, reactionType: ReactionType): Promise<SageReaction> {
		const sageCache = await SageCache.fromMessageReaction(messageReaction, user);
		const sageReaction = new SageReaction({
			sageCache,
			messageReaction,
			reactionType,
			user
		});
		sageReaction.isGameMaster = await sageReaction.game?.hasUser(user.id as Snowflake, GameRoleType.GameMaster) ?? false;
		sageReaction.isPlayer = await sageReaction.game?.hasUser(user.id as Snowflake, GameRoleType.Player) ?? false;
		return sageReaction;
	}

}
