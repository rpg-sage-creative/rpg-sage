import type * as Discord from "discord.js";
import { DMessageChannel, ReactionType } from "../../../sage-utils/utils/DiscordUtils";
import type { TRenderableContentResolvable } from "../../../sage-utils/utils/RenderUtils/RenderableContent";
import SageCache from "./SageCache";
import { SageCommandBase, SageCommandCore, TSendArgs } from "./SageCommand";
import SageReactionArgs from "./SageReactionArgs";

type DUser = Discord.User | Discord.PartialUser;
type DMessage = Discord.Message | Discord.PartialMessage;
type DReaction = Discord.MessageReaction | Discord.PartialMessageReaction;

interface SageReactionCore extends SageCommandCore {
	messageReaction: DReaction;
	reactionType: ReactionType;
}

export default class SageReaction
	extends SageCommandBase<SageReactionCore, SageReactionArgs, SageReaction> {

	public constructor(protected core: SageReactionCore) {
		super(core);
	}

	public args = new SageReactionArgs();

	public isSageReaction(): this is SageReaction { return true; }

	public static async fromMessageReaction(messageReaction: DReaction, user: DUser, reactionType: ReactionType): Promise<SageReaction> {
		const sageCache = await SageCache.fromMessageReaction(messageReaction, user);
		return new SageReaction({
			sageCache,
			messageReaction,
			reactionType
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

	public get message(): DMessage {
		return this.core.messageReaction.message;
	}


	// public clone(): SageReaction {
	// 	return new SageReaction(this.core);
	// }

	public command: string | null = null;

	public async reply(args: TSendArgs): Promise<void>;
	public async reply(renderable: TRenderableContentResolvable, ephemeral: boolean): Promise<void>;
	public async reply(renderableOrArgs: TRenderableContentResolvable | TSendArgs, ephemeral?: boolean): Promise<void> {
		const canSend = this.canSend(this.message.channel as DMessageChannel);
		if (!canSend) {
			return this.whisper(`Unable to send message because Sage doesn't have permissions to channel: ${this.message.channel}`);
		}
		const replyOptions = this.resolveToOptions(renderableOrArgs, ephemeral);
		await this.message.reply(replyOptions);
	}

	public async whisper(content: string): Promise<void>;
	public async whisper(args: TSendArgs): Promise<void>;
	public async whisper(contentOrArgs: string | TSendArgs): Promise<void> {
		const args = typeof(contentOrArgs) === "string" ? { content:contentOrArgs } : contentOrArgs;
		const sendOptions = this.resolveToOptions(args);
		await this.actor.d.send(sendOptions);
	}
}
