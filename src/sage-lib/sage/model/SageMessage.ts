import type * as Discord from "discord.js";
import utils, { Optional } from "../../../sage-utils";
import { DMessage, DiscordKey, TChannel, TCommandAndArgs, TRenderableContentResolvable } from "../../discord";
import { send } from "../../discord/messages";
import { EmojiType } from "./HasEmojiCore";
import SageCache from "./SageCache";
import { SageCommandBase, SageCommandCore, TSendArgs } from "./SageCommand";
import SageMessageArgs from "./SageMessageArgs";
import { resolveToEmbeds } from "../../discord/embeds";

interface SageMessageCore extends SageCommandCore {
	message: DMessage;
	originalMessage?: DMessage;
	prefix: string;
	hasPrefix: boolean;
	slicedContent: string;
}

export default class SageMessage<HasServer extends boolean = boolean>
	extends SageCommandBase<SageMessageCore, SageMessageArgs, SageMessage, HasServer> {

	/** @deprecated Use actor.did */
	public get authorDid(): Discord.Snowflake { return this.actor.did; }

	public constructor(protected core: SageMessageCore) {
		super(core);
		this.setCommandAndArgs();
	}

	public isSageMessage(): this is SageMessage { return true; }

	public static async fromMessage(message: DMessage, originalMessage: Optional<DMessage>): Promise<SageMessage> {
		const sageCache = await SageCache.fromMessage(message),
			prefix = sageCache.getPrefixOrDefault(),
			hasPrefix = message.content?.slice(0, prefix.length).toLowerCase() === prefix.toLowerCase(),
			slicedContent = hasPrefix ? message.content!.slice(prefix.length).trim() : message.content!;
		return new SageMessage({
			message,
			originalMessage: originalMessage ?? undefined,
			prefix,
			hasPrefix,
			slicedContent,
			sageCache
		});
	}

	// TODO: THIS IS NOT A PERMANENT SOLUTION; REPLACE THIS WHEN WE START PROPERLY TRACKING MESSAGES/DICE!
	public clone(): SageMessage {
		const clone = new SageMessage(this.core);
		clone._ = this._;
		return clone;
	}

	//#region core

	public get message(): DMessage { return this.core.message; }
	public get isEdit(): boolean { return !!this.core.originalMessage; }
	public get prefix(): string { return this.core.prefix; }
	public get hasPrefix(): boolean { return this.core.hasPrefix; }
	public get slicedContent(): string { return this.core.slicedContent; }

	public get hasCommandContent(): boolean { return this.slicedContent.startsWith("!"); }
	public get hasQueryContent(): boolean { return this.slicedContent.startsWith("?"); }
	public get hasSlicedContent(): boolean { return typeof(this.message.content) === "string" && this.message.content.length !== this.slicedContent.length; }
	public get hasCommandOrQueryOrSlicedContent(): boolean { return this.hasCommandContent || this.hasQueryContent || this.hasSlicedContent; }

	//#region Command / Args

	private commandAndArgs?: TCommandAndArgs;
	public get command(): string { return this.commandAndArgs?.command ?? "INVALID COMMAND"; }
	public args!: SageMessageArgs;
	public setCommandAndArgs(commandAndArgs?: TCommandAndArgs): SageMessage {
		this.commandAndArgs = {
			command: commandAndArgs?.command,
			args: SageMessageArgs.from(commandAndArgs?.args ?? [])
		};
		this.args = new SageMessageArgs(this, this.commandAndArgs.args!);
		return this;
	}

	//#endregion

	//#endregion

	//#region Send / Replace / Whisper

	public _ = new Map<"Dialog" | "Dice" | "Replacement" | "Sent", DMessage>();
	public send(renderableContentResolvable: TRenderableContentResolvable): Promise<Discord.Message[]>;
	public send(renderableContentResolvable: TRenderableContentResolvable, targetChannel: TChannel): Promise<Discord.Message[]>;
	public send(renderableContentResolvable: TRenderableContentResolvable, targetChannel: TChannel, originalAuthor: Discord.User): Promise<Discord.Message[]>;
	public async send(renderableContentResolvable: TRenderableContentResolvable, targetChannel = this.message.channel as TChannel, originalAuthor = this.message.author, notifyIfBlocked = false): Promise<Discord.Message[]> {
		const canSend = await this.canSend(targetChannel);
		if (!canSend) {
			if (notifyIfBlocked) {
				await this.reactBlock(`Unable to send message because Sage doesn't have permissions to channel: ${targetChannel}`);
			}
			return [];
		}
		// check to see if we have channel send message permissions
		const renderableContent = utils.RenderUtils.RenderableContent.resolve(renderableContentResolvable);
		if (renderableContent) {
			const sent = await send(this.sageCache, targetChannel, renderableContent, originalAuthor);
			if (sent.length) {
				this._.set("Sent", sent[sent.length - 1]);
			}
			return sent;
		}
		return [];
	}

	public async reply(args: TSendArgs): Promise<void>;
	public async reply(renderable: TRenderableContentResolvable, ephemeral: boolean): Promise<void>;
	public async reply(renderableOrArgs: TRenderableContentResolvable | TSendArgs, ephemeral?: boolean): Promise<void> {
		const canSend = await this.canSend(this.message.channel as TChannel);
		if (!canSend) {
			this.reactBlock();
			return this.whisper(`Unable to reply to your message because Sage doesn't have permissions to channel: ${this.message.channel}`);
		}
		const args = this.resolveToOptions(renderableOrArgs, ephemeral);
		return this.message.reply(args) as Promise<any>;
	}

	public async whisper(args: TSendArgs): Promise<void>;
	public async whisper(content: TRenderableContentResolvable): Promise<void>;
	public async whisper(contentOrArgs: TSendArgs | TRenderableContentResolvable): Promise<void> {
		const args = typeof(contentOrArgs) === "string" ? { content:contentOrArgs } : contentOrArgs;
		const sendOptions = this.resolveToOptions(args);
		const canSend = await this.canSend(this.message.channel as TChannel);
		if (canSend && false) {
			//include a button to delete the reply message!
			return this.message.reply(sendOptions) as Promise<any>;
		}
		// include a link to the original message!
		(sendOptions.embeds ?? (sendOptions.embeds = [])).push(...resolveToEmbeds(this.sageCache, `<a href="${this.message.url}">[link to original message]</a>`));
		return this.actor.d.send(sendOptions) as Promise<any>;
	}

	//#endregion

	// #region Reactions

	/** Get the given emoji, checking first the game, then server, then the bot. */
	public getEmoji(emojiType: EmojiType): string | null {
		return this.game?.emoji.get(emojiType)
			?? this.server?.emoji.get(emojiType)
			?? this.bot.emoji.get(emojiType);
	}

	/** If the given emoji is valid, react to this message with it. If this message posted a new message, react to it. */
	public async react(emojiType: EmojiType, reason?: string): Promise<void> {
		// TODO: start saving the reason for reactions so users can click them to get a DM about what the fuck is going on
		const emoji = this.getEmoji(emojiType);
		if (emoji) {
			const reacted = await this._react(this.message, emoji)
				|| await this._react(this._.get("Dialog") ?? this._.get("Replacement") ?? this._.get("Sent"), emoji);
			if (!reacted && reason) {
				// in case we are unable to react to something, we can ping the user and let them know what's up
				this.message.author?.send(`${emoji} ${reason}\n<${this.message.url}>`);
			}
		}
	}
	/** This was pulled here to avoid duplicating code. */
	private async _react(message: Optional<DMessage>, emoji: string): Promise<boolean> {
		if (message && await this.canReact(message)) {
			const reaction = await message.react(emoji).catch(utils.ConsoleUtils.Catchers.errorReturnNull);
			return reaction ? true : false;
		}
		return false;
	}
	public async canReact(message: DMessage = this.message): Promise<boolean> {
		if (!message || !message.deletable) {
			return false;
		}
		return this.sageCache.canReactTo(DiscordKey.fromMessage(message));
	}

	public async reactBlock(reason?: string): Promise<void> { this.react(EmojiType.PermissionDenied, reason); }
	public async reactDie(reason?: string): Promise<void> { this._.set("Dice", this.message); this.react(EmojiType.Die, reason); }
	public async reactError(reason?: string): Promise<void> { this.react(EmojiType.CommandError, reason); }
	public async reactWarn(reason?: string): Promise<void> { this.react(EmojiType.CommandWarn, reason); }
	public async reactFailure(reason?: string): Promise<void> {
		this.react(EmojiType.CommandFailure, reason);
		if (reason) {
			this.whisper(`Your command failed for the following reason:\n> ${reason}`);
		}
	}
	public async reactSuccess(reason?: string): Promise<void> { this.react(EmojiType.CommandSuccess, reason); }
	public async reactSuccessOrFailure(bool: boolean, reason?: string): Promise<void> { bool ? this.reactSuccess(reason) : this.reactFailure(reason); }

	// #endregion

}
