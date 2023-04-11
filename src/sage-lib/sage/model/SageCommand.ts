import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, EmbedBuilder, Guild, Snowflake, StringSelectMenuBuilder } from "discord.js";
import { GameType } from "../../../sage-common";
import { CritMethodType, DiceOutputType, DiceSecretMethodType } from "../../../sage-dice";
import { isDefined, type If, type Optional } from "../../../sage-utils";
import { SuperClass } from "../../../sage-utils/ClassUtils";
import { DChannel, DMessage, DMessageChannel, handleDiscordErrorReturnNull } from "../../../sage-utils/DiscordUtils";
import type { DInteraction, DiscordFetches } from "../../../sage-utils/DiscordUtils";
import type { DiscordKey } from "../../../sage-utils/DiscordUtils";
import { resolveToEmbeds, resolveToTexts } from "../../../sage-utils/DiscordUtils";
import type { TRenderableContentResolvable } from "../../../sage-utils/RenderUtils";
import { registerInteractionListener } from "../../discord/handlers";
import { createAdminRenderableContent } from "../commands/cmd";
import { DicePostType } from "../commands/dice";
import { DialogType, GameChannelType, IChannel } from "../repo/base/channel";
import type { Bot } from "./Bot";
import type { Game } from "./Game";
import type { GameCharacter } from "./GameCharacter";
import type { ColorType, HasCoreWithColors } from "./Colors";
import type { SageCache } from "./SageCache";
import type { TSageDiscordPair } from "./SageCache";
import type { ISageCommandArgs } from "./SageCommandArgs";
import type { SageInteraction } from "./SageInteraction";
import type { SageMessage } from "./SageMessage";
import type { SageReaction } from "./SageReaction";
import type { Server } from "./Server";
import { isString } from "../../../sage-utils/StringUtils";

export interface SageCommandCore {
	sageCache: SageCache;
}

export interface IHaveServer {
	guild: TSageDiscordPair<Guild, Server>;
	/** @deprecated User .guild.s */
	server: Server;
}

export interface IHaveGame {
	game: Game;
	gameChannel: IChannel;
}

export type TSendArgs<HasEphemeral extends boolean = boolean> = {
	content?: TRenderableContentResolvable;
	embeds?: TRenderableContentResolvable | EmbedBuilder[];
	components?: ActionRowBuilder<StringSelectMenuBuilder | ButtonBuilder>[];
	ephemeral?: If<HasEphemeral, boolean | null, never>;
};

export type TSendOptions<HasEphemeral extends boolean = boolean> = {
	content?: string;
	embeds?: EmbedBuilder[];
	components?: ActionRowBuilder<StringSelectMenuBuilder | ButtonBuilder>[];
	ephemeral?: If<HasEphemeral, boolean | null, never>;
};

type TDenial = { denyPerm:string; denyProv:never;  notFound:never;  }
			 | { denyPerm:never;  denyProv:string; notFound:never;  }
			 | { denyPerm:never;  denyProv:never;  notFound:string; };

export type SageCommand = SageCommandBase<SageCommandCore, ISageCommandArgs, any>;

//#region Message Delete Button

export async function addMessageDeleteButton(message: Optional<DMessage>, userDid: Snowflake): Promise<boolean> {
	if (message?.editable) {
		const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder({ customId:`message-delete-button-${message.id}-${userDid}`, style:ButtonStyle.Secondary, emoji:"❌", label:"Delete this alert." }));
		const edited = await message.edit({
			components: (message.components ?? []) .concat([buttonRow as any]), /** @todo figure out this cast */
			content: message.content,
			embeds: message.embeds
		}).catch(handleDiscordErrorReturnNull);
		return edited !== null;
	}
	return false;
}

function messageDeleteButtonTester(sageInteraction: SageInteraction<ButtonInteraction>): boolean {
	const customId = sageInteraction.interaction.customId;
	const regex = /^message\-delete\-button\-(\d{16,})\-(\d{16,})$/;
	const match = customId.match(regex) ?? [];
	return sageInteraction.interaction.message.id === match[1]
		&& sageInteraction.actor.did === match[2];
}

async function messageDeleteButtonHandler(sageInteraction: SageInteraction<ButtonInteraction>): Promise<void> {
	const message = sageInteraction.interaction.message as DMessage;
	if (message.deletable) {
		await message.delete();
	}
}

export function registerCommandHandlers(): void {
	registerInteractionListener(messageDeleteButtonTester, messageDeleteButtonHandler);
}

//#endregion

export abstract class SageCommandBase<
		T extends SageCommandCore,
		U extends ISageCommandArgs,
		_V extends SageCommandBase<T, U, any>,
		HasServer extends boolean = boolean
		>
	extends SuperClass {

	//#region deprecated as part of SageCommand consolidation and object clarification
	/** @deprecated use .discordKey.channel */
	public get channelDid() { return this.discordKey.channel; }
	//#endregion

	public constructor(protected core: T) {
		super();
	}

	public isSageInteraction<U extends DInteraction>(): this is SageInteraction<U> { return false; }
	public isSageMessage(): this is SageMessage { return false; }
	public isSageReaction(): this is SageReaction { return false; }

	//#region abstract

	public abstract args: U;

	/** @todo THIS IS NOT A PERMANENT SOLUTION; REPLACE THIS WHEN WE START PROPERLY TRACKING MESSAGES/DICE! */
	public clone(): this { return this; };

	public abstract reply(renderableOrArgs: TRenderableContentResolvable | TSendArgs, ephemeral?: boolean): Promise<void>;

	public abstract whisper(renderableOrArgs: TRenderableContentResolvable | TSendArgs): Promise<void>;

	//#endregion

	//#region caches

	/** The User objects for the actor doing the thing. */
	public get actor() { return this.sageCache.actor; }
	public get sageCache(): SageCache { return this.core.sageCache as SageCache; }
	public get bot(): Bot { return this.sageCache.bot; }
	/** @deprecated Use .sageCache.discord */
	public get discord(): DiscordFetches { return this.sageCache.discord; }
	public get discordKey(): DiscordKey { return this.sageCache.discordKey; }
	public get game(): Game | undefined { return this.sageCache.game; }
	public get guild(): If<HasServer, TSageDiscordPair<Guild, Server>> { return this.sageCache.guild as any; }
	public get server(): If<HasServer, Server> { return this.sageCache.guild?.s as any; }

	//#endregion

	//#region user "isX" flags

	/** Is the server HomeServer */
	public get isHomeServer(): boolean {
		return this.guild?.s.isHome === true;
	}

	/** Is a SuperUser */
	public get isSuperUser(): boolean {
		return this.sageCache.actor.isSuperUser;
	}

	//#endregion

	//#region channels

	public get dChannel(): DChannel | undefined {
		const channel =  this.isSageMessage() ? this.message.channel
			: this.isSageInteraction() ? ("channel" in this.interaction ? this.interaction.channel : null)
			: this.isSageReaction() ? this.message.channel
			: null;
		return channel as DChannel ?? undefined;
	}

	/** Returns the gameChannel meta, or the serverChannel meta if no gameChannel isDefined. */
	public get channel(): IChannel | undefined {
		return this.gameChannel ?? this.serverChannel;
	}

	//#endregion

	//#region games

	public get critMethodType(): CritMethodType {
		return this.cache.get("critMethodType", () => this.gameChannel?.defaultCritMethodType ?? this.game?.defaultCritMethodType ?? this.serverChannel?.defaultCritMethodType ?? this.server?.defaultCritMethodType ?? CritMethodType.Unknown);
	}

	public get dialogType(): DialogType {
		return this.cache.get("dialogType", () => this.actor.s.defaultDialogType ?? this.gameChannel?.defaultDialogType ?? this.game?.defaultDialogType ?? this.serverChannel?.defaultDialogType ?? this.server?.defaultDialogType ?? DialogType.Embed);
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

	/** Returns the gameChannel meta for the message, checking the thread before checking its channel. */
	public get gameChannel(): IChannel | undefined {
		return this.cache.get("gameChannel", () => this.game?.getChannel(this.discordKey.channel));
	}

	/** Returns the GameType by climbing the chain: game > serverChannel > server > GameType.None */
	public get gameType(): GameType {
		return this.cache.get("gameType", () => this.game?.gameType ?? this.serverChannel?.defaultGameType ?? this.server?.defaultGameType ?? GameType.None);
	}

	/** Is there a game and is the actor a GameMaster */
	public get isGameMaster(): boolean {
		return !!this.sageCache.actor.isGameUser?.isGameMaster;
	}

	/** Is there a game and is the actor a Player */
	public get isPlayer(): boolean {
		return !!this.sageCache.actor.isGameUser?.isPlayer;
	}

	/** Get the PlayerCharacter if there a game and the actor is a Player */
	public async fetchPlayerCharacter(): Promise<GameCharacter | undefined> {
		return this.cache.get("playerCharacter", () => {
			return this.game?.fetchPlayerCharacters().then(pcs => pcs.findByUser(this.actor.did)) ?? undefined;
		});
	}

	//#endregion

	//#region servers

	/** Returns the serverChannel meta, checking the thread before checking its channel. */
	public get serverChannel(): IChannel | undefined {
		return this.cache.get("serverChannel", () => this.server?.getChannel(this.discordKey));
	}

	//#endregion

	// #region HasCoreWithColors related

	public getHasColors(): HasCoreWithColors {
		return this.game ?? this.server ?? this.bot;
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

	// #region Permission

	private denyMap = new Map<string, TDenial | undefined>();
	private processDenial(key: string, label: string, handler: () => TDenial | undefined): Promise<void> | undefined {
		if (!this.denyMap.has(key)) {
			this.denyMap.set(key, handler());
		}
		const denial = this.denyMap.get(key);
		if (denial) {
			if (denial.denyPerm) {
				return this.deny(label, "You do not have permission to do that!", denial.denyPerm);
			}
			if (denial.denyProv) {
				return this.deny(label, "This channel does not allow that!", denial.denyProv);
			}
			if (denial.notFound) {
				return this.deny(label, `${denial.notFound} Not Found!`, "");
			}
			console.warn({ fn:"processDenial", key, label, denial })
			return this.deny(label, `Sorry, you can't do that!`, "");
		}
		return undefined;
	}

	/**
	 * Returns true if commands are allowed *and* you have access.
	 * Returns undefined if commands are allowed *but* you don't have access.
	 * Returns false if commands are not allowed.
	 */
	private checkCanCommandChannel(): boolean | undefined {
		// always allow commands in DM, always allow an admin access to commands (to enable setup)
		if (!this.server || this.actor.isSuperUser || this.actor.isServerAdmin) {
			return true;
		}


		const game = this.game;
		if (game) {
			// If you aren't an admin or part of the game, no commands AT ALL
			if (!(this.actor.isGameAdmin || this.isGameMaster || this.isPlayer)) {
				return undefined;
			}

			// if we allow it, then return true
			if (checkOverrideAndType(this.gameChannel)) {
				return true;
			}

			// before returning false, we need to ensure at least one channel in the game allows commands
			if (game.channels.find(ch => checkOverrideAndType(ch))) {
				return false;
			}

			// must allow commands until a channel is set to allow commands
			return true;

		}

		// if we allow it or we aren't provisioned yet, allow commands
		return checkOverrideAndType(this.serverChannel) !== false;

		function checkOverrideAndType(channel: Optional<IChannel>): boolean | undefined {
			if (!channel) {
				return undefined;
			}

			// check to see if it was set/overridden w/o channel type
			if (isDefined(channel.commands)) {
				return channel.commands;
			}

			// we haven't overridden as true/false, so we can now check channel type
			const channelType = channel.gameChannelType ?? undefined;

			// if we have a channel type set ...
			if (isDefined(channelType)) {
				// ... if we are in a channel that allows commands, then allow the command
				return [GameChannelType.OutOfCharacter, GameChannelType.GameMaster, GameChannelType.Miscellaneous].includes(channelType);
			}

			return false;
		}
	}

	public checkDenyCommand(label = ""): Promise<void> | undefined {
		const key = `${this.discordKey.channel}-commands`;
		return this.processDenial(key, label, () => {
			const checkResults = this.checkCanCommandChannel();
			return checkResults ? undefined
				: checkResults === false
				? { denyProv:"Channel must allow Command actions." } as TDenial
				: { denyPerm:"You must be a Game Master or Player for this Game or a GameAdmin, Administrator, Manager, or Owner of this server." } as TDenial;
		});
	}

	/**
	 * Returns true if dialog is allowed *and* you have access.
	 * Returns undefined if dialog is allowed *but* you don't have access.
	 * Returns false if dialog is not allowed.
	 */
	private checkCanDialogChannel(): boolean | undefined {
		const game = this.game;
		if (game) {
			// If you aren't part of the game, no dialog AT ALL
			if (!(this.isGameMaster || this.isPlayer)) {
				return undefined;
			}
		}

		// we don't allow dialog in unprovisioned channels
		return checkOverrideAndType(this.channel) === true;

		function checkOverrideAndType(channel: Optional<IChannel>): boolean | undefined {
			if (!channel) {
				return undefined;
			}

			// check to see if it was set/overridden w/o channel type
			if (isDefined(channel.dialog)) {
				return channel.dialog;
			}

			// we haven't overridden as true/false, so we can now check channel type
			const channelType = channel.gameChannelType ?? undefined;

			// if we have a channel type set ...
			if (isDefined(channelType)) {
				// ... if we are in a channel that allows dialog, then allow the dialog
				return ![GameChannelType.None, GameChannelType.Dice].includes(channelType);
			}

			return false;
		}
	}

	public checkDenyDialog(label = "Dialog Commands"): Promise<void> | undefined {
		const key = `${this.discordKey.channel}-dialog`;
		return this.processDenial(key, label, () => {
			const checkResults = this.checkCanDialogChannel();
			return checkResults ? undefined
				: checkResults === false
				? { denyProv:"Channel must allow Dialog actions." } as TDenial
				: { denyPerm:"You must be a Game Master or Player for this Game." } as TDenial;
		});
	}

	/**
	 * Returns true if dice is allowed *and* you have access.
	 * Returns undefined if dice is allowed *but* you don't have access.
	 * Returns false if dice is not allowed.
	 */
	public checkCanDiceChannel(): boolean | undefined {
		const game = this.game;
		if (game) {
			// If you aren't part of the game, no dice AT ALL
			if (!(this.isGameMaster || this.isPlayer)) {
				return undefined;
			}
		}

		// if we allow it or we aren't provisioned yet, allow dice
		return checkOverrideAndType(this.channel) !== false;

		function checkOverrideAndType(channel: Optional<IChannel>): boolean | undefined {
			if (!channel) {
				return undefined;
			}

			// check to see if it was set/overridden w/o channel type
			if (isDefined(channel.dice)) {
				return channel.dice;
			}

			// we haven't overridden as true/false, so we can now check channel type
			const channelType = channel.gameChannelType ?? undefined;

			// if we have a channel type set ...
			if (isDefined(channelType)) {
				// ... if we are in a channel that allows dice, then allow the dice
				return channelType !== GameChannelType.None;
			}

			return false;
		}
	}

	public checkDenyDice(label = "Dice Commands"): Promise<void> | undefined {
		const key = `${this.discordKey.channel}-dice`;
		return this.processDenial(key, label, () => {
			const checkResults = this.checkCanDiceChannel();
			return checkResults ? undefined
				: checkResults === false
				? { denyProv:"Channel must allow Dice actions." } as TDenial
				: { denyPerm:"You must be a Game Master or Player for this Game." } as TDenial;
		});
	}

	// public checkDenyAdminGame(game: Optional<Game>): Promise<void> | undefined;
	// public checkDenyAdminGame(game: Optional<Game>, label: string): Promise<void> | undefined;
	public checkDenyAdminGame(label: string): Promise<void> | undefined;
	public checkDenyAdminGame(...args: (Optional<Game> | string)[]): Promise<void> | undefined {
		// Grab the only string arg or use default label
		const label = args.find(isString) as string ?? "Game Admin";
		// Filter to all non-string args, because we might have a null or undefined Game ...
		// const games = args.filter(arg => typeof(arg) !== "string") as Game[];
		// If we weren't passed a possible Game, then get it from sageMessage
		// const game = games.length === 0 ? this.game : games[0];
		const game = this.game;
		// Build the key, undefined will be fine in the key
		const key = `${game?.id}-adminGame`;
		return this.processDenial(key, label, () => {
			if (!game) {
				return { notFound:"Game" } as TDenial;
			}
			const checkResults = this.actor.isSuperUser || this.actor.isServerAdmin || this.actor.isGameAdmin || this.actor.isGameUser?.isGameMaster;
			return checkResults ? undefined
				: { denyPerm:"You must be a GameMaster for this game or a GameAdmin, Administrator, Manager, or Owner of this server." } as TDenial;
		});
	}

	public checkDenyAdminGames(label = "Games Admin"): Promise<void> | undefined {
		const guildDid = this.guild?.did;
		const key = `${guildDid}-adminGames`;
		return this.processDenial(key, label, () => {
			if (!guildDid) {
				return { notFound:"Server" } as TDenial;
			}
			const checkResults = this.actor.isSuperUser || this.actor.isServerAdmin || this.actor.isGameAdmin;
			return checkResults ? undefined
				: { denyPerm:"You must be a GameAdmin, Administrator, Manager, or Owner of this server." } as TDenial;
		});
	}

	public checkDenyAdminServer(label = "Server Admin"): Promise<void> | undefined {
		const guildDid = this.guild?.did;
		const key = `${guildDid}-adminServer`;
		return this.processDenial(key, label, () => {
			if (!guildDid) {
				return { notFound:"Server" } as TDenial;
			}
			const checkResults = this.actor.isSuperUser || this.actor.isServerAdmin;
			return checkResults ? undefined
				: { denyPerm:"You must be an Administrator, Manager, or Owner of this server." } as TDenial;
		});
	}

	// #endregion

	protected resolveToOptions(renderableOrArgs: TRenderableContentResolvable | TSendArgs, ephemeral?: boolean): TSendOptions {
		if ((typeof(renderableOrArgs) === "string") || ("toRenderableContent" in renderableOrArgs)) {
			return {
				embeds: resolveToEmbeds(renderableOrArgs, this.sageCache.getFormatter()),
				ephemeral: ephemeral
			};
		}

		const options: TSendOptions = { };
		if (renderableOrArgs.content) {
			options.content = typeof(renderableOrArgs.content) === "string"
				? renderableOrArgs.content
				: resolveToTexts(renderableOrArgs.content, this.sageCache.getFormatter()).join("\n");
		}
		if (renderableOrArgs.embeds) {
			options.embeds = Array.isArray(renderableOrArgs.embeds)
				? renderableOrArgs.embeds
				: resolveToEmbeds(renderableOrArgs.embeds, this.sageCache.getFormatter());
		}
		if (renderableOrArgs.components) {
			options.components = renderableOrArgs.components;
		}
		options.ephemeral = (ephemeral ?? renderableOrArgs.ephemeral) === true;
		return options;
	}

	/** tests to see if Sage can send messsages to the channel (given or from the message/interaction) */
	public canSend(targetChannel: Optional<DMessageChannel>): targetChannel is DMessageChannel {
		if (!targetChannel) {
			if (this.isSageMessage() || this.isSageReaction()) {
				targetChannel = this.message.channel as DMessageChannel;
			}
			if (this.isSageInteraction()) {
				targetChannel = this.interaction.channel as DMessageChannel;
			}
		}
		return this.sageCache.discord.canSendMessageTo(targetChannel);
	}

	//#region deny commands

	public deny(label: string, what: string, details: string): Promise<void> {
		const renderable = createAdminRenderableContent(this.getHasColors());
		if (label) {
			renderable.appendTitledSection(`<b>${label}</b>`, what);
		}else {
			renderable.appendSection(what);
		}
		if (details) {
			renderable.append(`<i>${details}</i>`);
		}
		return this.whisper({ embeds:renderable });
	}

	/** @deprecated */
	public denyByPerm(label: string, details: string): Promise<void> {
		return this.deny(label, "You do not have permission to do that!", details);
	}

	/** @deprecated */
	public denyByProv(label: string, details: string): Promise<void> {
		return this.deny(label, "This channel does not allow that!", details);
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
}
