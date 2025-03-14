import { SageChannelType } from "@rsc-sage/types";
import { Cache } from "@rsc-utils/cache-utils";
import { debug, error, errorReturnNull, warn, type Optional, type Snowflake } from "@rsc-utils/core-utils";
import { DiscordApiError, DiscordKey, safeMentions, toHumanReadable, toMessageUrl, type MessageChannel, type MessageOrPartial } from "@rsc-utils/discord-utils";
import { RenderableContent, type RenderableContentResolvable } from "@rsc-utils/render-utils";
import type { Message, User } from "discord.js";
import XRegExp from "xregexp";
import { ArgsManager } from "../../discord/ArgsManager.js";
import { isDeleted } from "../../discord/deletedMessages.js";
import { send } from "../../discord/messages.js";
import { resolveToContent } from "../../discord/resolvers/resolveToContent.js";
import { sendTo } from "../../discord/sendTo.js";
import { type TCommandAndArgs } from "../../discord/types.js";
import { createAdminRenderableContent } from "../commands/cmd.js";
import type { Game } from "../model/Game.js";
import { GameRoleType } from "../model/Game.js";
import { EmojiType } from "./HasEmojiCore.js";
import { SageCache } from "./SageCache.js";
import { SageCommand, type SageCommandCore, type TSendArgs } from "./SageCommand.js";
import { SageMessageArgs } from "./SageMessageArgs.js";
import type { HasChannels, HasGame } from "./index.js";
import { addMessageDeleteButton } from "./utils/deleteButton.js";

interface SageMessageCore extends SageCommandCore {
	message: MessageOrPartial;
	prefix: string;
	hasPrefix: boolean;
	slicedContent: string;
}

export class SageMessage
	extends SageCommand<SageMessageCore, SageMessageArgs>
	implements HasGame, HasChannels {

	private constructor(protected core: SageMessageCore, cache?: Cache) {
		super(core, cache);
		this.setCommandAndArgs();
	}

	public isCommand(...args: string[]): boolean {
		const commandValues = this.commandValues;
		return args.every((arg, index) => commandValues[index] === arg.toLowerCase());
	}
	public get commandValues(): string[] {
		return this.commandAndArgs?.command?.toLowerCase().split("|") ?? [];
	}

	public static async fromMessage(message: Message): Promise<SageMessage> {
		const sageCache = await SageCache.fromMessage(message);
		const prefixOrDefault = sageCache.getPrefixOrDefault();
		const regexOr = prefixOrDefault ? XRegExp.escape(prefixOrDefault) : `sage`;
		const prefixRegex = XRegExp(`^\\s*(${regexOr})?[!?][!]?`, "i");
		const prefixMatch = prefixRegex.exec(message.content ?? "");
		const prefixFound = prefixMatch?.[1] ?? "";
		const hasPrefix = [prefixOrDefault.toLowerCase(), "sage"].includes(prefixFound.toLowerCase());
		const prefix = hasPrefix ? prefixFound : prefixOrDefault;
		const safeContent = safeMentions(message.content ?? "").trim();
		const slicedContent = hasPrefix ? safeContent.slice(prefix.length).trim() : safeContent;
		const sageMessage = new SageMessage({
			message,
			prefix,
			hasPrefix,
			slicedContent,
			sageCache
		});
		sageMessage.isGameMaster = await sageMessage.game?.hasUser(message.author?.id as Snowflake, GameRoleType.GameMaster) ?? false;
		sageMessage.isPlayer = await sageMessage.game?.hasUser(message.author?.id as Snowflake, GameRoleType.Player) ?? false;
		return sageMessage;
	}

	/** @todo: THIS IS NOT A PERMANENT SOLUTION; REPLACE THIS WHEN WE START PROPERLY TRACKING MESSAGES/DICE! */
	public clone(): this {
		const clone = new SageMessage(this.core, this.cache);
		clone._ = this._;
		return clone as this;
	}

	public async fetchMessage(messageId?: Snowflake): Promise<Message> {
		const message = this.core.message.partial
			? await this.core.message.fetch()
			: this.core.message;
		if (messageId && messageId !== message.id) {
			return message.channel.messages.fetch(messageId);
		}
		return message;
	}

	public clear(): void {
		debug("Clearing SageMessage");
		this.cache.clear();
		this.sageCache.clear();
	}

	//#region core

	public get message(): MessageOrPartial { return this.core.message; }
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
	public commandMatches(value: string | RegExp): boolean {
		const regex = value instanceof RegExp ? value : XRegExp(`^${value}`, "i");
		return regex.test(this.command);
	}
	public args!: SageMessageArgs;
	public setCommandAndArgs(commandAndArgs?: TCommandAndArgs): this {
		this.commandAndArgs = {
			command: commandAndArgs?.command,
			args: ArgsManager.from(commandAndArgs?.args!)
		};
		this.args = new SageMessageArgs(this, this.commandAndArgs.args!);
		return this;
	}

	//#endregion

	//#endregion

	//#region Send / Replace

	public _ = new Map<"Dialog" | "Dice" | "Replacement" | "Sent", MessageOrPartial>();
	public send(renderableContentResolvable: RenderableContentResolvable): Promise<Message[]>;
	public send(renderableContentResolvable: RenderableContentResolvable, targetChannel: MessageChannel): Promise<Message[]>;
	public send(renderableContentResolvable: RenderableContentResolvable, targetChannel: MessageChannel, originalAuthor: User): Promise<Message[]>;
	public async send(renderableContentResolvable: RenderableContentResolvable, targetChannel = this.message.channel, originalAuthor = this.message.author, notifyIfBlocked = false): Promise<Message[]> {
		const canSend = await this.canSend(targetChannel);
		if (!canSend) {
			if (notifyIfBlocked) {
				await this.reactBlock(`Unable to send message because Sage doesn't have permissions to channel: ${toHumanReadable(targetChannel)}`);
			}
			return [];
		}
		// check to see if we have channel send message permissions
		const renderableContent = RenderableContent.resolve(renderableContentResolvable);
		if (renderableContent) {
			const sent = await send(this.sageCache, targetChannel, renderableContent, originalAuthor);
			if (sent.length) {
				this._.set("Sent", sent[sent.length - 1]);
			}
			return sent;
		}
		return [];
	}
	public async sendPost(renderableContentResolvable: RenderableContentResolvable): Promise<Message[]> {
		const target = this.message.channel;
		const sendArgs = {
			sageCache: this.sageCache,
			target,
			content: resolveToContent(this.sageCache, renderableContentResolvable).join("\n")
		};
		const catchHandler = (err: unknown) => {
			error(`${toHumanReadable(target)}: SageMessage.sendPost`, err);
		};
		const messages = await sendTo(sendArgs, { }, catchHandler);
		return messages ?? [];
	}
	public async canSend(targetChannel = this.message.channel): Promise<boolean> {
		return this.sageCache.canSendMessageTo(DiscordKey.from(targetChannel));
	}

	public async reply(args: TSendArgs): Promise<void>;
	public async reply(renderable: RenderableContentResolvable, ephemeral: boolean): Promise<void>;
	public async reply(renderableOrArgs: RenderableContentResolvable | TSendArgs, ephemeral?: boolean): Promise<void> {
		const canSend = await this.canSend(this.message.channel);
		if (!canSend) {
			return this.reactBlock(`Unable to reply to your message because Sage doesn't have permissions to channel: ${toHumanReadable(this.message.channel)}`);
		}
		const args = this.resolveToOptions(renderableOrArgs, ephemeral);
		await this.message.reply(args);
	}

	public async whisper(args: TSendArgs): Promise<void>;
	public async whisper(content: RenderableContentResolvable): Promise<void>;
	public async whisper(contentOrArgs: TSendArgs | RenderableContentResolvable): Promise<void> {
		const args = typeof(contentOrArgs) === "string" ? { content:contentOrArgs } : contentOrArgs;
		const sendOptions = this.resolveToOptions(args);
		const canSend = await this.canSend(this.message.channel);
		const deleted = isDeleted(this.message.id as Snowflake);
		let message = canSend && !deleted ? await this.message.reply(sendOptions).catch(DiscordApiError.process) : null;
		if (!message) {
			// include a link to the original message!
			const replyingTo = `*replying to* ${deleted ? "~~deleted message~~" : toMessageUrl(this.message)}`;
			const newLine = sendOptions.content ? "\n" : "";
			const originalContent = sendOptions.content ?? "";
			sendOptions.content = replyingTo + newLine + originalContent;
			message = await this.message.author?.send(sendOptions) ?? null;
		}
		await addMessageDeleteButton(message, this.sageUser.did);
	}

	//#endregion

	// #region HasChannels

	/** Returns the channelDid this message (or its thread) is in. */
	public get channelDid(): Snowflake | undefined {
		return this.cache.getOrSet("channelDid", () => {
			/** @todo investigate the notes found in threadDid below */
			if (this.message.channel?.isThread()) {
				return this.message.channel.parent?.id as Snowflake;
			}
			return this.message.channel?.id as Snowflake;
		});
	}


	/** Returns the threadDid this message is in. */
	public get threadDid(): Snowflake | undefined {
		return this.cache.getOrSet("threadDid", () => {
			/**
			 * original: this.message.channel.isThread()
			 * updated: this.message.channel?.isThread()
			 * we got an error here that .channel was null.
			 * @todo investigate what can make the channel null.
			 * is it possible Sage was used in a channel type we aren't expecting?
			 * is it possible Sage was used in a channel type we aren't aware of?
			 * is it possible a partial message?
			 */
			if (this.message.channel?.isThread()) {
				return this.message.channel.id as Snowflake;
			}
			return undefined;
		});
	}

	/** Returns either the message's threadDid or channelDid if there is no thread. */
	public get threadOrChannelDid(): Snowflake {
		return this.cache.getOrSet("channelDid", () => this.threadDid ?? this.channelDid ?? this.message.channel.id as Snowflake);
	}

	// #endregion

	// #region Reactions

	/** If the given emoji is valid, react to this message with it. If this message posted a new message, react to it. */
	public async react(emojiType: EmojiType, reason?: string): Promise<void> {
		/** @todo: start saving the reason for reactions so users can click them to get a DM about what the fuck is going on */
		const emoji = this.getEmoji(emojiType);
		if (!emoji) {
			warn(`Invalid emojiType: ${emojiType} >> ${reason ?? "no reason given"}`);
		}
		if (emoji && !reason) {
			const reacted = await this._react(this.message, emoji)
				|| await this._react(this._.get("Dialog") ?? this._.get("Replacement") ?? this._.get("Sent"), emoji);
			if (!reacted) {
				/** @todo Tupper often deletes the post the dice roll came from, so let's just not report on those ... */
				if (emojiType !== EmojiType.Die) {
					reason = `Sorry, we were unable to indicate the results of your action via emoji.\n<${this.message.url}>`;
				}
			}
		}
		if (reason) {
			this.whisper(`${emoji ?? ""} ${reason}`);
		}
	}
	/** This was pulled here to avoid duplicating code. */
	private async _react(message: Optional<MessageOrPartial>, emoji: string): Promise<boolean> {
		if (!message) {
			return false;
		}

		await this.sageCache.pauseForTupper(DiscordKey.from(message));

		if (!(await this.canReact(message))) {
			return false;
		}

		// just in case it was deleted while we were waiting
		if (isDeleted(message.id as Snowflake)) {
			return false;
		}

		const reaction = await message?.react(emoji).catch(errorReturnNull);
		return !!reaction;
	}

	public async canReact(message: MessageOrPartial = this.message): Promise<boolean> {
		if (!message) return false;
		return this.sageCache.canReactTo(DiscordKey.from(message));
	}

	public reactBlock(reason?: string): Promise<void> { return this.react(EmojiType.PermissionDenied, reason); }
	public reactDie(reason?: string): Promise<void> { this._.set("Dice", this.message); return this.react(EmojiType.Die, reason); }
	public reactError(reason?: string): Promise<void> { return this.react(EmojiType.CommandError, reason); }
	public reactWarn(reason?: string): Promise<void> { return this.react(EmojiType.CommandWarn, reason); }
	public reactFailure(reason?: string): Promise<void> { return this.react(EmojiType.CommandFailure, reason); }
	public reactSuccess(reason?: string): Promise<void> { return this.react(EmojiType.CommandSuccess, reason); }
	public reactSuccessOrFailure(bool: boolean, reason?: string): Promise<void> { return bool ? this.reactSuccess(reason) : this.reactFailure(reason); }

	// #endregion

	//#region deny

	public deny(label: string, what: string, details: string): Promise<void> {
		const renderable = createAdminRenderableContent(this.getHasColors());
		if (label) {
			renderable.appendTitledSection(`<b>${label}</b>`, what);
		}else {
			renderable.appendSection(what);
		}
		if (details) {
			if (details.includes("\n> ")) {
				renderable.append(details);
			}else {
				renderable.append(`<i>${details}</i>`);
			}
		}
		return this.whisper({ embeds:renderable });
	}

	public denyByPerm(label: string, details: string): Promise<void> {
		return this.deny(label, "You do not have permission to do that!", details);
	}

	public denyByProv(label: string, details: string): Promise<void> {
		return this.deny(label, "This channel does not allow that!", details);
	}

	public denyForGame(label: string): Promise<void> {
		return this.denyByPerm(label, "Must be a GameMaster or Player for this game or a GameAdmin, Administrator, Manager, or Owner of this server.");
	}

	public denyForCanAdminGame(label: string): Promise<void> {
		return this.denyByPerm(label, "Must be a GameMaster for this game or a GameAdmin, Administrator, Manager, or Owner of this server.");
	}

	public denyForCanAdminGames(label: string): Promise<void> {
		return this.denyByPerm(label, "Must be GameAdmin, Administrator, Manager, or Owner of this server.");
	}

	public denyForCanAdminServer(label: string): Promise<void> {
		return this.denyByPerm(label, "Must be Administrator, Manager, or Owner of this server.");
	}

	//#endregion

	// #region Permission

	/** Ensures we are either in the channel being targeted or we are in an admin channel. */
	public testChannelAdmin(channelDid: Optional<Snowflake>): boolean {
		/** @todo: figure out if i even need this or if there is a better way */
		return channelDid === this.channelDid || ![SageChannelType.None, SageChannelType.Dice].includes(this.channel?.type!);
	}

	/** Ensures we have a game and can admin games or are the GM. */
	public testGameAdmin(game: Optional<Game>): game is Game {
		return !!game && (this.canAdminGames || game.hasGameMaster(this.authorDid));
	}

	/** Ensures we are either in an admin channel or are the server owner or SuperUser. */
	public testServerAdmin(): boolean {
		return this.canManageServer || this.isSuperUser || ![SageChannelType.None, SageChannelType.Dice].includes(this.serverChannel?.type!);
	}

	// #endregion
}
