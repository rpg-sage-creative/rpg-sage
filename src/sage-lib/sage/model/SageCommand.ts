import type * as Discord from "discord.js";
import { GameType } from "../../../sage-common";
import { CritMethodType, DiceOutputType, DiceSecretMethodType } from "../../../sage-dice";
import type { If, Optional } from "../../../sage-utils";
import { SuperClass } from "../../../sage-utils/utils/ClassUtils";
import type { DChannel } from "../../../sage-utils/utils/DiscordUtils";
import type DiscordFetches from "../../../sage-utils/utils/DiscordUtils/DiscordFetches";
import type DiscordKey from "../../../sage-utils/utils/DiscordUtils/DiscordKey";
import { resolveToEmbeds, resolveToTexts } from "../../../sage-utils/utils/DiscordUtils/embeds";
import type { TRenderableContentResolvable } from "../../../sage-utils/utils/RenderUtils/RenderableContent";
import { createAdminRenderableContent } from "../commands/cmd";
import { DicePostType } from "../commands/dice";
import { DialogType, IChannel } from "../repo/base/channel";
import type Bot from "./Bot";
import type Game from "./Game";
import type GameCharacter from "./GameCharacter";
import type { ColorType, IHasColorsCore } from "./HasColorsCore";
import type SageCache from "./SageCache";
import type { TSageDiscordPair } from "./SageCache";
import type { ISageCommandArgs } from "./SageCommandArgs";
import type SageInteraction from "./SageInteraction";
import type SageMessage from "./SageMessage";
import type SageReaction from "./SageReaction";
import type Server from "./Server";

export interface SageCommandCore<HasGuild extends boolean = boolean, HasGuildChannel extends boolean = boolean, HasUser extends boolean = boolean> {
	sageCache: SageCache<HasGuild, HasGuildChannel, HasUser>;
}

export interface ICanHaveServer<HasServer extends boolean = boolean> {
	guild: If<HasServer, TSageDiscordPair<Discord.Guild, Server>>;
	server: If<HasServer, Server>;
}

export interface IHaveServer {
	guild: TSageDiscordPair<Discord.Guild, Server>;
	/** @deprecated User .guild.s */
	server: Server;
}

export interface ICanHaveGame<HasGame extends boolean = boolean> {
	game: If<HasGame, Game>;
}

export interface IHaveGame {
	game: Game;
}

export type TSendArgs<HasEphemeral extends boolean = boolean> = {
	content?: TRenderableContentResolvable;
	embeds?: TRenderableContentResolvable | Discord.MessageEmbed[];
	components?: Discord.MessageActionRow[];
	ephemeral?: If<HasEphemeral, boolean | null, never>;
};

export type TSendOptions<HasEphemeral extends boolean = boolean> = {
	content?: string | null;
	embeds?: Discord.MessageEmbed[];
	components?: Discord.MessageActionRow[];
	ephemeral?: If<HasEphemeral, boolean | null, never>;
};

export type SageCommand = SageCommandBase<SageCommandCore, ISageCommandArgs, any>;

export abstract class SageCommandBase<
		T extends SageCommandCore,
		U extends ISageCommandArgs,
		_V extends SageCommandBase<T, U, any>,
		HasServer extends boolean = boolean,
		HasGuild extends boolean = boolean,
		HasGuildChannel extends boolean = boolean,
		HasUser extends boolean = boolean
		>
	extends SuperClass
	implements ICanHaveServer<HasServer>, ICanHaveGame {

	//#region deprecated as part of SageCommand consolidation and object clarification
	/** @deprecated use .discordKey.channel */
	public get channelDid() { return this.discordKey.channel; }
	//#endregion

	public constructor(protected core: T) {
		super();
	}

	public isSageInteraction(): this is SageInteraction { return false; }
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
	public get sageCache(): SageCache<HasGuild, HasGuildChannel, HasUser> { return this.core.sageCache as SageCache; }
	public get bot(): Bot { return this.sageCache.bot; }
	/** @deprecated Use .sageCache.discord */
	public get discord(): DiscordFetches<HasGuild, HasGuildChannel, HasUser> { return this.sageCache.discord; }
	public get discordKey(): DiscordKey { return this.sageCache.discordKey; }
	public get game(): Game | undefined { return this.sageCache.game; }
	public get guild(): If<HasServer, TSageDiscordPair<Discord.Guild, Server>> { return this.sageCache.guild as any; }
	public get server(): If<HasServer, Server> { return this.sageCache.guild?.s as any; }

	//#endregion

	//#region flags

	//#region channel "allow" flags

	/** Quick flag for "this" Channel (!this.channel || this.channel.admin === true) */
	public get allowAdmin(): boolean {
		return this.cache.get("allowAdmin", () => !this.channel || this.channel.admin === true);
	}

	/** Quick flag for "this" Channel (!this.channel || this.channel.commands === true) */
	public get allowCommand(): boolean {
		return this.cache.get("allowCommand", () => !this.channel || this.channel.commands === true);
	}

	/** Quick flag for "this" Channel (this.server ? this.channel?.dialog === true : false) */
	public get allowDialog(): boolean {
		return this.cache.get("allowDialog", () => this.server ? this.channel?.dialog === true : false);
	}

	/** Quick flag for "this" Channel (!this.channel || this.channel.dice === true) */
	public get allowDice(): boolean {
		return this.cache.get("allowDice", () => !this.channel || this.channel.dice === true);
	}

	/** Quick flag for "this" Channel (!this.channel || this.channel.search === true) */
	public get allowSearch(): boolean {
		return this.cache.get("allowSearch", () => !this.channel || this.channel.search === true);
	}

	//#endregion

	//#region user "isX" flags

	// /** Can admin Games */
	// public get isGameAdmin(): boolean {
	// 	return this.sageCache.actor.isGameAdmin;
	// }

	/** Is the server HomeServer */
	public get isHomeServer(): boolean {
		return this.guild?.s.isHome === true;
	}

	// /** Can admin Server */
	// public get isServerAdmin(): boolean {
	// 	return this.sageCache.actor.isServerAdmin;
	// }

	/** Is a SuperUser */
	public get isSuperUser(): boolean {
		return this.sageCache.actor.isSuperUser;
	}

	//#endregion

	//#endregion

	//#region channels

	/** Returns the gameChannel meta, or the serverChannel meta if no gameChannel exists. */
	public get channel(): IChannel | undefined {
		return this.cache.get("channel", () => this.gameChannel ?? this.serverChannel);
	}

	//#endregion

	//#region games

	public async findCategoryGame(): Promise<Game | null> {
		// const category = (<Discord.TextChannel>this.message.channel).parent;
		// if (category) {
		// 	const server = this.server;
		// 	if (server) {
		// 		// const categoryChannels = category.children.array();
		// 		const categoryGames: Game[] = [];
		// 		// for (const channel of categoryChannels) {
		// 		// 	categoryGames.push(await server.getActiveGameByChannelDid(channel.id));
		// 		// }
		// 		// const categoryGames = await utils.ArrayUtils.Async.map(categoryChannels, channel => server.getActiveGameByChannelDid(channel.id));
		// 		const categoryGame = categoryGames[0];
		// 		if (categoryGame) {
		// 			return this.sageCache.games.getById(categoryGame.id);
		// 		}
		// 	}
		// }
		return null;
	}

	public async getGameOrCategoryGame(): Promise<Game | null> {
		return this.game ?? this.findCategoryGame();
	}

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
		return this.cache.get("isGameMaster", () => this.game?.hasGameMaster(this.actor.did) === true);
	}

	/** Is there a game and is the actor a Player */
	public get isPlayer(): boolean {
		return this.cache.get("isPlayer", () => this.game?.hasPlayer(this.actor.did) === true);
	}

	/** Get the PlayerCharacter if there a game and the actor is a Player */
	public get playerCharacter(): GameCharacter | undefined {
		return this.cache.get("playerCharacter", () => this.isPlayer ? this.game?.playerCharacters.findByUser(this.actor.did) ?? undefined : undefined);
	}

	//#endregion

	//#region servers

	/** Returns the serverChannel meta, checking the thread before checking its channel. */
	public get serverChannel(): IChannel | undefined {
		return this.cache.get("serverChannel", () => this.server?.getChannel(this.discordKey));
	}

	//#endregion

	// #region IHasColorsCore related

	public getHasColors(): IHasColorsCore {
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

	/** Ensures we are either in the channel being targeted or we are in an admin channel. */
	public testChannelAdmin(channelDid: Optional<Discord.Snowflake>): this is IHaveServer {
		//TODO: figure out if i even need this or if there is a better way
		return channelDid === this.discordKey.channel || this.channel?.admin === true;
	}

	/** Checks to see if the actor can admin the Command's Game. */
	public checkCanAdminGame(): this is IHaveGame & IHaveServer;
	/** Checks to see if the actor can admin the given Game. */
	public checkCanAdminGame(game: Optional<Game>): game is Game;
	public checkCanAdminGame(...args: Optional<Game>[]): boolean {
		const game = args.length ? args[0] : this.game;
		return !!game && (this.checkCanAdminGames() || this.isGameMaster);
	}

	public checkCanAdminGames(): this is IHaveServer;
	public checkCanAdminGames(): boolean {
		return !!this.server && (this.actor.isSuperUser || this.actor.isServerAdmin || this.actor.isGameAdmin);
	}

	public checkCanAdminServer(): this is IHaveServer;
	public checkCanAdminServer(): boolean {
		return !!this.server && (this.actor.isSuperUser || this.actor.isServerAdmin);
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
	public async canSend(targetChannel: Optional<DChannel>): Promise<boolean> {
		if (!targetChannel) {
			if (this.isSageMessage() || this.isSageReaction()) {
				targetChannel = this.message.channel as DChannel;
			}
			if (this.isSageInteraction()) {
				targetChannel = this.interaction.channel as DChannel;
			}
		}
		return this.sageCache.discord.canSendMessageTo(targetChannel);
	}

	//#region deny commands

	public deny(label: string, what: string, details: string): Promise<void> {
		const renderable = createAdminRenderableContent(this.getHasColors());
		renderable.appendTitledSection(`<b>${label}</b>`, what, `<i>${details}</i>`);
		return this.whisper({ embeds:renderable });
	}

	public denyByPerm(label: string, details: string): Promise<void> {
		return this.deny(label, "You do not have permission to do that!", details);
	}

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
