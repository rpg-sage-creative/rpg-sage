import type * as Discord from "discord.js";
import { CritMethodType, DiceOutputType, DiceSecretMethodType, GameType } from "../../../sage-dice";
import utils, { Optional } from "../../../sage-utils";
import { DiscordKey, DMessage, NilSnowflake, TChannel, TCommandAndArgs, TRenderableContentResolvable } from "../../discord";
import { send } from "../../discord/messages";
import { DicePostType } from "../commands/dice";
import type Game from "../model/Game";
import type { IChannel } from "../repo/base/IdRepository";
import type GameCharacter from "./GameCharacter";
import type { ColorType, IHasColorsCore } from "./HasColorsCore";
import { EmojiType } from "./HasEmojiCore";
import HasSageCache, { HasSageCacheCore } from "./HasSageCache";
import SageCache from "./SageCache";
import SageMessageArgsManager from "./SageMessageArgsManager";

interface SageMessageCore extends HasSageCacheCore {
	message: DMessage;
	originalMessage?: DMessage;
	prefix: string;
	hasPrefix: boolean;
	slicedContent: string;
}

export default class SageMessage
	extends HasSageCache<SageMessageCore, SageMessage> {

	public constructor(protected core: SageMessageCore) {
		super(core);
		this.setCommandAndArgs();
	}

	public static async fromMessage(message: DMessage, originalMessage: Optional<DMessage>): Promise<SageMessage> {
		const caches = await SageCache.fromMessage(message),
			prefix = caches.getPrefixOrDefault(),
			hasPrefix = message.content?.slice(0, prefix.length).toLowerCase() === prefix.toLowerCase(),
			slicedContent = hasPrefix ? message.content!.slice(prefix.length).trim() : message.content!;
		return new SageMessage({
			message,
			originalMessage: originalMessage ?? undefined,
			prefix,
			hasPrefix,
			slicedContent,
			caches
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
	public args!: SageMessageArgsManager;
	public setCommandAndArgs(commandAndArgs?: TCommandAndArgs): SageMessage {
		this.commandAndArgs = {
			command: commandAndArgs?.command,
			args: SageMessageArgsManager.from(commandAndArgs?.args!)
		};
		this.args = new SageMessageArgsManager(this, this.commandAndArgs.args!);
		return this;
	}

	//#endregion

	//#endregion

	//#region Send / Replace

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
			const sent = await send(this.caches, targetChannel, renderableContent, originalAuthor);
			if (sent.length) {
				this._.set("Sent", sent[sent.length - 1]);
			}
			return sent;
		}
		return [];
	}
	public async canSend(targetChannel = this.message.channel as TChannel): Promise<boolean> {
		return this.caches.canSendMessageTo(DiscordKey.fromChannel(targetChannel));
	}

	//#endregion

	// #region Channel flags

	/** Returns the gameChannel meta, or the serverChannel meta if no gameChannel exists. */
	public get channel(): IChannel | undefined {
		return this.cache.get("channel", () => this.gameChannel ?? this.serverChannel);
	}

	/** Returns the channelDid this message (or its thread) is in. */
	public get channelDid(): Discord.Snowflake | undefined {
		return this.cache.get("channelDid", () => {
			if (this.message.channel.isThread()) {
				return this.message.channel.parent?.id;
			}
			return this.message.channel.id;
		});
	}

	/** Returns the gameChannel meta for the message, checking the thread before checking its channel. */
	public get gameChannel(): IChannel | undefined {
		return this.cache.get("gameChannel", () => this.game?.getChannel(this.discordKey));
	}

	/** Returns the serverChannel meta for the message, checking the thread before checking its channel. */
	public get serverChannel(): IChannel | undefined {
		return this.cache.get("serverChannel", () => this.server?.getChannel(this.discordKey));
	}

	/** Returns the threadDid this message is in. */
	public get threadDid(): Discord.Snowflake | undefined {
		return this.cache.get("threadDid", () => {
			if (this.message.channel.isThread()) {
				return this.message.channel.id;
			}
			return undefined;
		});
	}

	/** Returns either the message's threadDid or channelDid if there is no thread. */
	public get threadOrChannelDid(): Discord.Snowflake {
		return this.cache.get("channelDid", () => this.threadDid ?? this.channelDid ?? this.message.channel.id);
	}

	// #endregion

	// #region User flags

	/** Author of the message */
	public get authorDid(): Discord.Snowflake {
		return this.cache.get("authorDid", () => this.message.author?.id ?? NilSnowflake);
	}

	/** Is the author the owner of the message's server */
	public get isOwner(): boolean {
		return this.cache.get("isOwner", () => this.message.guild?.ownerId === this.authorDid);
	}

	/** Can admin Sage settings, Server channels, Games, and Game channels */
	public get isSageAdmin(): boolean {
		return this.cache.get("isSageAdmin", () => (this.authorDid && this.server?.hasSageAdmin(this.authorDid)) === true);
	}

	/** Can admin Server channels and Game channels */
	public get isServerAdmin(): boolean {
		return this.cache.get("isServerAdmin", () => (this.authorDid && this.server?.hasServerAdmin(this.authorDid)) === true);
	}

	/** Can admin Games and Game channels */
	public get isGameAdmin(): boolean {
		return this.cache.get("isGameAdmin", () => (this.authorDid && this.server?.hasGameAdmin(this.authorDid)) === true);
	}

	/** Is there a game and is the author a GameMaster */
	public get isGameMaster(): boolean {
		return this.cache.get("isGameMaster", () => (this.authorDid && this.game?.hasGameMaster(this.authorDid)) === true);
	}

	/** Is there a game and is the author a Player */
	public get isPlayer(): boolean {
		return this.cache.get("isPlayer", () => (this.authorDid && this.game?.hasPlayer(this.authorDid)) === true);
	}

	/** Get the PlayerCharacter if there a game and the author is a Player */
	public get playerCharacter(): GameCharacter | undefined {
		return this.cache.get("playerCharacter", () => this.authorDid && this.isPlayer ? this.game?.playerCharacters.findByUser(this.authorDid) ?? undefined : undefined);
	}

	// #endregion

	// #region Permission Flags

	/** Quick flag for Sage admins (isSuperUser || isOwner || isSageAdmin) */
	public get canAdminSage(): boolean {
		return this.cache.get("canAdminSage", () => this.isSuperUser || this.isOwner || this.isSageAdmin);
	}

	/** Quick flag for Server admins (canAdminSage || isServerAdmin) */
	public get canAdminServer(): boolean {
		return this.cache.get("canAdminServer", () => this.canAdminSage || this.isServerAdmin);
	}

	/** Quick flag for Game admins (canAdminServer || isGameAdmin) */
	public get canAdminGames(): boolean {
		return this.cache.get("canAdminGames", () => this.canAdminServer || this.isGameAdmin);
	}

	/** Quick flag for "this" Game (game && (canAdminGames || isGameMaster)) */
	public get canAdminGame(): boolean {
		return this.cache.get("canAdminGame", () => !!this.game && (this.canAdminGames || this.isGameMaster));
	}

	// #endregion

	// #region Function flags

	public get allowAdmin(): boolean {
		return this.cache.get("allowAdmin", () => !this.channel || this.channel.admin === true);
	}

	public get allowCommand(): boolean {
		return this.cache.get("allowCommand", () => !this.channel || this.channel.commands === true);
	}

	public get allowDialog(): boolean {
		return this.cache.get("allowDialog", () => this.server && this.channel?.dialog === true);
	}

	public get allowDice(): boolean {
		return this.cache.get("allowDice", () => !this.channel || this.channel.dice === true);
	}

	public get allowSearch(): boolean {
		return this.cache.get("allowSearch", () => !this.channel || this.channel.search === true);
	}

	public get dialogType(): "Post" | "Webhook" {
		return "Webhook";
	}

	// #endregion

	//#region Type flags

	public get gameType(): GameType {
		return this.cache.get("gameType", () => this.game?.gameType ?? this.serverChannel?.defaultGameType ?? this.server?.defaultGameType ?? GameType.None);
	}

	public get critMethodType(): CritMethodType {
		return this.cache.get("critMethodType", () => this.gameChannel?.defaultCritMethodType ?? this.game?.defaultCritMethodType ?? this.serverChannel?.defaultCritMethodType ?? this.server?.defaultCritMethodType ?? CritMethodType.Unknown);
	}

	public get dicePostType(): DicePostType {
		return this.cache.get("dicePostType", () => this.gameChannel?.defaultDicePostType ?? this.game?.defaultDicePostType ?? this.serverChannel?.defaultDicePostType ?? this.server?.defaultDicePostType ?? DicePostType.SinglePost);
	}

	public get diceOutputType(): DiceOutputType {
		return this.cache.get("diceOutputType", () => this.gameChannel?.defaultDiceOutputType ?? this.game?.defaultDiceOutputType ?? this.serverChannel?.defaultDiceOutputType ?? this.server?.defaultDiceOutputType ?? DiceOutputType.M);
	}

	public get diceSecretMethodType(): DiceSecretMethodType {
		return this.cache.get("diceSecretMethodType", () => this.gameChannel?.defaultDiceSecretMethodType ?? this.game?.defaultDiceSecretMethodType ?? this.serverChannel?.defaultDiceSecretMethodType ?? this.server?.defaultDiceSecretMethodType ?? DiceSecretMethodType.Ignore);
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
		return this.caches.canReactTo(DiscordKey.fromMessage(message));
	}

	public async reactBlock(reason?: string): Promise<void> { this.react(EmojiType.PermissionDenied, reason); }
	public async reactDie(reason?: string): Promise<void> { this._.set("Dice", this.message); this.react(EmojiType.Die, reason); }
	public async reactError(reason?: string): Promise<void> { this.react(EmojiType.CommandError, reason); }
	public async reactWarn(reason?: string): Promise<void> { this.react(EmojiType.CommandWarn, reason); }
	public async reactFailure(reason?: string): Promise<void> { this.react(EmojiType.CommandFailure, reason); }
	public async reactSuccess(reason?: string): Promise<void> { this.react(EmojiType.CommandSuccess, reason); }
	public async reactSuccessOrFailure(bool: boolean, reason?: string): Promise<void> { bool ? this.reactSuccess(reason) : this.reactFailure(reason); }

	// #endregion

	// #region Permission

	/** Ensures we are either in the channel being targeted or we are in an admin channel. */
	public testChannelAdmin(channelDid: Optional<Discord.Snowflake>): boolean {
		//TODO: figure out if i even need this or if there is a better way
		return channelDid === this.channelDid || this.channel?.admin === true;
	}

	/** Ensures we have a game and can admin games or are the GM. */
	public testGameAdmin(game: Optional<Game>): game is Game {
		return !!game && (this.canAdminGames || game.hasGameMaster(this.authorDid));
	}

	/** Ensures we are either in an admin channel or are the server owner or SuperUser. */
	public testServerAdmin(): boolean {
		return this.isOwner || this.isSuperUser || this.serverChannel?.admin === true;
	}

	// #endregion

	// #region IHasColorsCore

	public getHasColors(): IHasColorsCore {
		return this.game || this.server || this.bot;
	}

	// public colors = this.game?.colors ?? this.server?.colors ?? this.bot.colors;
	public toDiscordColor(colorType: Optional<ColorType>): string | null {
		if (!colorType) {
			return null;
		}
		if (this.game) {
			return this.game.toDiscordColor(colorType);
		}
		if (this.server) {
			return this.server.toDiscordColor(colorType);
		}
		return this.bot.toDiscordColor(colorType);
	}

	// #endregion

}
