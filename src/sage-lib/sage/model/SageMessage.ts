import { SageChannelType } from "@rsc-sage/types";
import { Cache } from "@rsc-utils/cache-utils";
import { debug, errorReturnNull, warn } from "@rsc-utils/console-utils";
import { DiscordKey, handleDiscordErrorReturnNull, safeMentions, toHumanReadable, toMessageUrl, type DMessage, type DMessageChannel } from "@rsc-utils/discord-utils";
import { RenderableContent, type RenderableContentResolvable } from "@rsc-utils/render-utils";
import { type Snowflake } from "@rsc-utils/snowflake-utils";
import type { Optional } from "@rsc-utils/type-utils";
import type { Message, User } from "discord.js";
import { ArgsManager } from "../../discord/ArgsManager.js";
import { isDeleted } from "../../discord/deletedMessages.js";
import { send } from "../../discord/messages.js";
import { resolveToContent } from "../../discord/resolvers/resolveToContent.js";
import { sendTo } from "../../discord/sendTo.js";
import { type TCommandAndArgs } from "../../discord/types.js";
import { createAdminRenderableContent } from "../commands/cmd.js";
import type { Game } from "../model/Game.js";
import { GameRoleType } from "../model/Game.js";
import type { GameCharacter } from "./GameCharacter.js";
import { EmojiType } from "./HasEmojiCore.js";
import { SageCache } from "./SageCache.js";
import { SageCommand, type SageCommandCore, type TSendArgs } from "./SageCommand.js";
import { SageMessageArgs } from "./SageMessageArgs.js";
import type { TAlias } from "./User.js";
import type { HasChannels, HasGame } from "./index.js";
import { addMessageDeleteButton } from "./utils/deleteButton.js";

interface SageMessageCore extends SageCommandCore {
	message: DMessage;
	originalMessage?: DMessage;
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
	public get commandValues(): string[] { return this.commandAndArgs?.command?.toLowerCase().split(/\s+|-/) ?? []; }

	public static async fromMessage(message: DMessage, originalMessage: Optional<DMessage>): Promise<SageMessage> {
		const sageCache = await SageCache.fromMessage(message);
		const prefixOrDefault = sageCache.getPrefixOrDefault();
		const prefixRegex = prefixOrDefault
			? new RegExp(`^\s*(sage|${prefixOrDefault})[!?][!]?`, "i")
			: new RegExp(`^\s*(sage)?[!?][!]?`, "i");
		const prefixMatch = prefixRegex.exec(message.content ?? "") ?? [];
		const hasPrefix = prefixMatch.length > 0;
		const prefix = hasPrefix ? prefixMatch[1] ?? "" : prefixOrDefault;
		const safeContent = safeMentions(message.content ?? "").trim();
		const slicedContent = hasPrefix ? safeContent.slice(prefix.length).trim() : safeContent;
		const sageMessage = new SageMessage({
			message,
			originalMessage: originalMessage ?? undefined,
			prefix,
			hasPrefix,
			slicedContent,
			sageCache
		});
		sageMessage.isGameMaster = await sageMessage.game?.hasUser(message.author?.id, GameRoleType.GameMaster) ?? false;
		sageMessage.isPlayer = await sageMessage.game?.hasUser(message.author?.id, GameRoleType.Player) ?? false;
		return sageMessage;
	}

	/** @todo: THIS IS NOT A PERMANENT SOLUTION; REPLACE THIS WHEN WE START PROPERLY TRACKING MESSAGES/DICE! */
	public clone(): this {
		const clone = new SageMessage(this.core, this.cache);
		clone._ = this._;
		return clone as this;
	}
	public clear(): void {
		debug("Clearing SageMessage");
		this.cache.clear();
		this.sageCache.clear();
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
	public commandMatches(value: string | RegExp): boolean {
		const regex = value instanceof RegExp ? value : new RegExp(`^${value}`, "i");
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

	public _ = new Map<"Dialog" | "Dice" | "Replacement" | "Sent", DMessage>();
	public send(renderableContentResolvable: RenderableContentResolvable): Promise<Message[]>;
	public send(renderableContentResolvable: RenderableContentResolvable, targetChannel: DMessageChannel): Promise<Message[]>;
	public send(renderableContentResolvable: RenderableContentResolvable, targetChannel: DMessageChannel, originalAuthor: User): Promise<Message[]>;
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
				this._.set("Sent", sent[sent.length - 1] as DMessage);
			}
			return sent;
		}
		return [];
	}
	public sendPost(renderableContentResolvable: RenderableContentResolvable) {
		return sendTo({
			sageCache: this.sageCache,
			target: this.message.channel,
			content: resolveToContent(this.sageCache, renderableContentResolvable).join("\n"),
			errMsg: "SageMessage.sendPost"
		}, { });
	}
	public async canSend(targetChannel = this.message.channel): Promise<boolean> {
		return this.sageCache.canSendMessageTo(DiscordKey.fromChannel(targetChannel));
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
		const deleted = isDeleted(this.message.id);
		let message = canSend && !deleted ? await this.message.reply(sendOptions).catch(handleDiscordErrorReturnNull) : null;
		if (!message) {
			// include a link to the original message!
			const replyingTo = `*replying to* ${deleted ? "~~deleted message~~" : toMessageUrl(this.message)}`;
			const newLine = sendOptions.content ? "\n" : "";
			const originalContent = sendOptions.content ?? "";
			sendOptions.content = replyingTo + newLine + originalContent;
			message = await this.message.author?.send(sendOptions) ?? null;
		}
		await addMessageDeleteButton(message as DMessage, this.sageUser.did);
	}

	//#endregion

	// #region HasChannels

	/** Returns the channelDid this message (or its thread) is in. */
	public get channelDid(): Snowflake | undefined {
		return this.cache.get("channelDid", () => {
			if (this.message.channel.isThread()) {
				return this.message.channel.parent?.id;
			}
			return this.message.channel.id;
		});
	}


	/** Returns the threadDid this message is in. */
	public get threadDid(): Snowflake | undefined {
		return this.cache.get("threadDid", () => {
			if (this.message.channel.isThread()) {
				return this.message.channel.id;
			}
			return undefined;
		});
	}

	/** Returns either the message's threadDid or channelDid if there is no thread. */
	public get threadOrChannelDid(): Snowflake {
		return this.cache.get("channelDid", () => this.threadDid ?? this.channelDid ?? this.message.channel.id);
	}

	// #endregion


	// #region Reactions

	/** Get the given emoji, checking first the game, then server, then the bot. */
	public getEmoji(emojiType: EmojiType): string | null {
		return this.game?.emoji.get(emojiType)
			?? this.server?.emoji.get(emojiType)
			?? this.bot.emoji.get(emojiType);
	}

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
				reason = `Sorry, we were unable to indicate the results of your action via emoji.\n<${this.message.url}>`;
			}
		}
		if (reason) {
			this.whisper(`${emoji ?? ""} ${reason}`);
		}
	}
	/** This was pulled here to avoid duplicating code. */
	private async _react(message: Optional<DMessage>, emoji: string): Promise<boolean> {
		if (!message) {
			return false;
		}

		await this.sageCache.pauseForTupper(DiscordKey.fromMessage(message));

		if (!(await this.canReact(message))) {
			return false;
		}

		// just in case it was deleted while we were waiting
		if (isDeleted(message.id)) {
			return false;
		}

		const reaction = await message?.react(emoji).catch(errorReturnNull);
		return !!reaction;
	}

	public async canReact(message: DMessage = this.message): Promise<boolean> {
		if (!message) return false;
		return this.sageCache.canReactTo(DiscordKey.fromMessage(message));
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
		return this.isOwner || this.isSuperUser || ![SageChannelType.None, SageChannelType.Dice].includes(this.serverChannel?.type!);
	}

	// #endregion

	public findAlias(aliasName?: string): (TAlias & {charAlias?:boolean}) | null {
		if (!aliasName) {
			return null;
		}

		const found = this.sageUser.aliases.findByName(aliasName, true);
		if (found) {
			return found;
		}

		let char = this.playerCharacter?.matches(aliasName) ? this.playerCharacter : undefined;
		if (!char) {
			const nonPlayerCharacters = this.game ? this.isGameMaster ? this.game.nonPlayerCharacters : undefined : this.sageUser.nonPlayerCharacters;
			if (!char) {
				debug("not pc");
				char = nonPlayerCharacters?.findByName(aliasName);
			}
			if (!char) {
				debug("not npc");
				char = nonPlayerCharacters?.findCompanionByName(aliasName);
			}

			const playerCharacters = this.game?.playerCharacters ?? this.sageUser.playerCharacters;
			if (!char) {
				debug("not minion");
				char = playerCharacters?.findByUser(this.isPlayer ? this.authorDid : undefined, aliasName);
			}
			if (!char) {
				debug("not pc");
				char = playerCharacters?.findCompanionByName(aliasName);
			}
		}

		if (char) {
			return alias(char);
		}
		debug("not companion");

		return null;

		function alias(char: GameCharacter) {
			return { name:aliasName!, target:`${char.type}::${char.name}::`, charAlias:true };
		}
	}
}
