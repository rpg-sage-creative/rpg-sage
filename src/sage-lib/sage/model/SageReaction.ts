import { isSageId } from "@rsc-sage/env";
import { Cache, debug, type Snowflake } from "@rsc-utils/core-utils";
import { DiscordApiError, type ReactionOrPartial, type SMessageOrPartial, type UserOrPartial } from "@rsc-utils/discord-utils";
import type { Message, MessageReaction } from "discord.js";
import { ReactionType } from "../../discord/index.js";
import { SageCommand, type SageCommandCore } from "./SageCommand.js";
import { SageEventCache } from "./SageEventCache.js";
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

	public async fetchMessage(messageId?: Snowflake): Promise<Message> {
		const messageReaction = await this.fetchMessageReaction();
		const message = messageReaction.message.partial
			? await messageReaction.message.fetch()
			: messageReaction.message;
		if (messageId && messageId !== message.id) {
			return message.channel.messages.fetch(messageId)
		}
		return message;
	}

	public async fetchMessageReaction(): Promise<MessageReaction> {
		if (this.core.messageReaction.partial) {
			return this.core.messageReaction.fetch();
		}
		return this.core.messageReaction;
	}

	public async isAuthorSageOrWebhook(): Promise<boolean> {
		const message = await this.fetchMessage().catch(DiscordApiError.process);
		if (!message) return false;

		const messageAuthorId = message.author.id;
		if (isSageId(messageAuthorId)) {
			return true;
		}

		if (!message.guild) return false;

		const webhook = await this.eventCache.discord.fetchWebhook(message);
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
	public get message(): SMessageOrPartial {
		return this.core.messageReaction.message as SMessageOrPartial;
	}

	public clear(): void {
		debug("Clearing SageReaction");
		this.cache.clear();
		this.eventCache.clear();
	}

	public async reply(): Promise<void> { }

	public async whisper(): Promise<void> { }

	public static async fromMessageReaction(messageReaction: ReactionOrPartial, user: UserOrPartial, reactionType: ReactionType): Promise<SageReaction> {
		return new SageReaction({
			eventCache: await SageEventCache.fromMessageReaction(messageReaction, user),
			messageReaction,
			reactionType,
			user
		});
	}

}
