import type * as Discord from "discord.js";
import type { IHasChannels, IHasGame } from ".";
import { CritMethodType, DiceOutputType, DiceSecretMethodType, GameType } from "../../../sage-dice";
import utils, { isDefined, Optional } from "../../../sage-utils";
import type { TGameType } from "../../../slash.mjs";
import { DInteraction, DiscordKey, DUser, InteractionType, TChannel, TRenderableContentResolvable } from "../../discord";
import { resolveToEmbeds } from "../../discord/embeds";
import { send } from "../../discord/messages";
import { DicePostType } from "../commands/dice";
import type { IChannel } from "../repo/base/IdRepository";
import type GameCharacter from "./GameCharacter";
import type { ColorType, IHasColorsCore } from "./HasColorsCore";
import HasSageCache, { HasSageCacheCore } from "./HasSageCache";
import SageCache from "./SageCache";

interface SageInteractionCore extends HasSageCacheCore {
	interaction: DInteraction;
	type: InteractionType;
}

export default class SageInteraction<T extends DInteraction = any>
	extends HasSageCache<SageInteractionCore, SageInteraction<any>>
	implements IHasGame, IHasChannels {

	public constructor(protected core: SageInteractionCore) {
		super(core);
	}

	//#region HasSageCache

	public clone(): SageInteraction<T> {
		return new SageInteraction(this.core);
	}

	//#endregion

	//#region command / category / sub

	public isCommand(command: string): boolean;
	public isCommand(gameType: TGameType, command: string): boolean;
	public isCommand(...args: string[]): boolean {
		if (!this.interaction.isCommand()) {
			return false;
		}

		const command = args.pop()!;
		const commandLower = command.toLowerCase();

		const game = args[0] as TGameType;
		const gameLower = game?.toLowerCase();

		const commandValues = this.commandValues.map(s => s.toLowerCase());
		if (commandValues[0] === "sage") {
			commandValues.shift();
		}

		if (game) {
			return commandValues[0] === gameLower
				&& commandValues[1] === commandLower;
		}

		return commandValues[0] === commandLower;
	}

	public get commandValues(): string[] {
		if (!this.interaction.isCommand()) {
			return [];
		}
		return [
			this.interaction.commandName,
			this.interaction.options.getSubcommandGroup(false),
			this.interaction.options.getSubcommand(false)
		].filter(isDefined);
	}

	//#endregion

	/** Gets the named option as a boolean or null */
	public getBoolean(name: string): boolean | null;
	/** Gets the named option as a boolean */
	public getBoolean(name: string, required: true): boolean;
	public getBoolean(name: string, required = false): boolean | null {
		return this.interaction.isCommand() ? this.interaction.options.getBoolean(name, required) : null;
	}
	/** Returns true if the argument was given a value. */
	public hasBoolean(name: string): boolean {
		return this.getBoolean(name) !== null;
	}

	/** Gets the named option as a number or null */
	public getNumber(name: string): number | null;
	/** Gets the named option as a number */
	public getNumber(name: string, required: true): number;
	public getNumber(name: string, required = false): number | null {
		return this.interaction.isCommand() ? this.interaction.options.getNumber(name, required) : null;
	}
	/** Returns true if the argument was given a value. */
	public hasNumber(name: string): boolean {
		return this.getNumber(name) !== null;
	}

	/** Gets the named option as a string or null */
	public getString<U extends string = string>(name: string): U | null;
	/** Gets the named option as a string */
	public getString<U extends string = string>(name: string, required: true): U;
	public getString(name: string, required = false): string | null {
		return this.interaction.isCommand() ? this.interaction.options.getString(name, required) : null;
	}
	/** Returns true if the argument was given a value. */
	public hasString(name: string): boolean {
		return this.getString(name) !== null;
	}

	/** Returns the interaction */
	public get interaction(): T {
		return this.core.interaction as T;
	}

	/** Returns the user */
	public get user(): DUser {
		return this.core.interaction.user;
	}

	//#region defer/reply

	/** Flag toggled when followUp() is called. */
	private updates: Discord.Message<boolean>[] = [];

	/** Defers the interaction so that a reply can be sent later. */
	public async defer(ephemeral: boolean): Promise<void> {
		return this.interaction.deferReply({ ephemeral:ephemeral ?? true });
	}

	/** Deletes the reply and any updates (ONLY IF NOT EPHEMERAL) */
	public async deleteReply(): Promise<void> {
		if (this.interaction.replied && !this.interaction.ephemeral) {
			if (this.updates.length) {
				await Promise.all(this.updates.map(update => update.deletable ? update.delete() : Promise.resolve()));
			}
			await this.interaction.deleteReply();
		}
	}

	/** Uses reply() it not replied to yet or editReply() to edit the previous reply. */
	public async reply(renderable: TRenderableContentResolvable, ephemeral: boolean): Promise<void> {
		const embeds = resolveToEmbeds(this.caches, renderable);
		if (this.interaction.deferred || this.interaction.replied) {
			await this.interaction.editReply({ embeds:embeds });
		}else {
			await this.interaction.reply({ embeds:embeds, ephemeral:ephemeral ?? true });
		}
	}

	/** Uses followUp() if a reply was given, otherwise uses reply()  */
	public async update(renderable: TRenderableContentResolvable, ephemeral: boolean): Promise<void> {
		if (this.interaction.replied) {
			const embeds = resolveToEmbeds(this.caches, renderable);
			this.updates.push(await this.interaction.followUp({ embeds:embeds }) as Discord.Message<boolean>);
		}else {
			await this.reply(renderable, ephemeral);
		}
	}

	/** Sends a full message to the channel or user the interaction originated in. */
	public send(renderableContentResolvable: TRenderableContentResolvable): Promise<Discord.Message[]>;
	public send(renderableContentResolvable: TRenderableContentResolvable, targetChannel: TChannel): Promise<Discord.Message[]>;
	public send(renderableContentResolvable: TRenderableContentResolvable, targetChannel: TChannel, originalAuthor: Discord.User): Promise<Discord.Message[]>;
	public async send(renderableContentResolvable: TRenderableContentResolvable, targetChannel = this.interaction.channel as TChannel, originalAuthor = this.interaction.user): Promise<Discord.Message[]> {
		const canSend = await this.canSend(targetChannel);
		if (!canSend) {
			return [];
		}
		// check to see if we have channel send message permissions
		const renderableContent = utils.RenderUtils.RenderableContent.resolve(renderableContentResolvable);
		if (renderableContent) {
			return send(this.caches, targetChannel, renderableContent, originalAuthor);
		}
		return [];
	}
	public async canSend(targetChannel = this.interaction.channel as TChannel): Promise<boolean> {
		return this.caches.canSendMessageTo(DiscordKey.fromChannel(targetChannel));
	}

	//#endregion

	// #region IHasChannels

	/** Returns the gameChannel meta, or the serverChannel meta if no gameChannel exists. */
	public get channel(): IChannel | undefined {
		return this.cache.get("channel", () => this.gameChannel ?? this.serverChannel);
	}

	/** Returns the channelDid this message (or its thread) is in. */
	public get channelDid(): Discord.Snowflake | undefined {
		return this.cache.get("channelDid", () => {
			if (this.interaction.channel?.isThread()) {
				return this.interaction.channel.parentId ?? undefined;
			}
			return this.interaction.channelId;
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
			if (this.interaction.channel?.isThread()) {
				return this.interaction.channelId;
			}
			return undefined;
		});
	}

	/** Returns either the message's threadDid or channelDid if there is no thread. */
	public get threadOrChannelDid(): Discord.Snowflake {
		return this.cache.get("channelDid", () => this.threadDid ?? this.channelDid ?? this.interaction.channelId);
	}

	// #endregion

	//#region IHasGame

	public get gameType(): GameType {
		return this.cache.get("gameType", () => this.game?.gameType ?? this.serverChannel?.defaultGameType ?? this.server?.defaultGameType ?? GameType.None);
	}

	/** Is there a game and is the author a GameMaster */
	public get isGameMaster(): boolean {
		return this.cache.get("isGameMaster", () => (this.user.id && this.game?.hasGameMaster(this.user.id)) === true);
	}

	/** Is there a game and is the author a Player */
	public get isPlayer(): boolean {
		return this.cache.get("isPlayer", () => (this.user.id && this.game?.hasPlayer(this.user.id)) === true);
	}

	/** Get the PlayerCharacter if there a game and the author is a Player */
	public get playerCharacter(): GameCharacter | undefined {
		return this.cache.get("playerCharacter", () => this.user.id && this.isPlayer ? this.game?.playerCharacters.findByUser(this.user.id) ?? undefined : undefined);
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

	public static async fromInteraction<T extends DInteraction>(interaction: T): Promise<SageInteraction<T>> {
		const caches = await SageCache.fromInteraction(interaction);
		const type = InteractionType.Unknown;
		return new SageInteraction({
			caches,
			interaction,
			type
		});
	}

}
