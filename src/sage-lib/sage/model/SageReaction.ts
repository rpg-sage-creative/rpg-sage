import { isSageId } from "@rsc-sage/env";
import { Cache } from "@rsc-utils/cache-utils";
import { debug, type Snowflake } from "@rsc-utils/core-utils";
import { DiscordApiError, type MessageOrPartial, type ReactionOrPartial, type UserOrPartial } from "@rsc-utils/discord-utils";
import type { Message, MessageReaction } from "discord.js";
import { ReactionType } from "../../discord/index.js";
import { GameRoleType } from "./Game.js";
import { SageCache } from "./SageCache.js";
import { SageCommand, type SageCommandCore } from "./SageCommand.js";
import { SageReactionArgs } from "./SageReactionArgs.js";

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

	public get emoji() {
		return this.core.messageReaction.emoji;
	}

	public fetchMessage(): Promise<Message> {
		return new Promise<Message>((resolve, reject) => {
			this.fetchMessageReaction().then(messageReaction => {
				if (messageReaction.message.partial) {
					messageReaction.message.fetch().then(resolve, reject);
				}else {
					resolve(messageReaction.message);
				}
			}, reject);
		});
	}

	public fetchMessageReaction(): Promise<MessageReaction> {
		return new Promise<MessageReaction>(async (resolve, reject) => {
			if (this.core.messageReaction.partial) {
				this.core.messageReaction.fetch().then(resolve, reject);
			}else {
				resolve(this.core.messageReaction);
			}
		});
	}

	public async isAuthorSageOrWebhook(): Promise<boolean> {
		const message = await this.fetchMessage().catch(DiscordApiError.process);
		if (!message) return false;

		const messageAuthorId = message.author.id;
		if (isSageId(messageAuthorId)) {
			return true;
		}

		if (!message.guild) return false;

		const webhook = await this.sageCache.discord.fetchWebhook(message);
		return webhook?.id === messageAuthorId;
	}

	/** @deprecated use fetchMessageReaction() */
	public get messageReaction(): ReactionOrPartial {
		return this.core.messageReaction;
	}

	public get user(): UserOrPartial {
		return this.core.user;
	}

	/** @deprecated use fetchMessage() */
	public get message(): MessageOrPartial {
		return this.core.messageReaction.message;
	}

	/** Returns the channelDid this message (or its thread) is in. */
	public get channelDid(): Snowflake | undefined {
		if (this.message.channel.isThread()) {
			return this.message.channel.parentId as Snowflake | undefined;
		}
		return this.message.channelId as Snowflake | undefined;
	}

	public clear(): void {
		debug("Clearing SageReaction");
		this.cache.clear();
		this.sageCache.clear();
	}

	public async reply(): Promise<void> { }

	public async whisper(): Promise<void> { }

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
