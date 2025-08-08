import { SageChannelType, type DialogPostType, type DicePostType } from "@rsc-sage/types";
import { Cache, debug, HasCache, isDefined, RenderableContent, stringOrUndefined, type Optional, type RenderableContentResolvable, type Snowflake } from "@rsc-utils/core-utils";
import type { DInteraction, DiscordCache, DRepliableInteraction, EmbedBuilder } from "@rsc-utils/discord-utils";
import { parseGameSystem, type DiceCriticalMethodType, type DiceOutputType, type DiceSecretMethodType, type DiceSortType, type GameSystemType } from "@rsc-utils/game-utils";
import { ComponentType, InteractionType, Message, MessageContextMenuCommandInteraction, PartialGroupDMChannel, UserContextMenuCommandInteraction, type ActionRowBuilder, type AttachmentBuilder, type AutocompleteInteraction, type ButtonBuilder, type ButtonInteraction, type CommandInteraction, type HexColorString, type If, type MessageComponentInteraction, type ModalSubmitInteraction, type StringSelectMenuBuilder, type StringSelectMenuInteraction, type TextBasedChannel } from "discord.js";
import type { LocalizedTextKey } from "../../../sage-lang/getLocalizedText.js";
import { resolveToContent } from "../../discord/resolvers/resolveToContent.js";
import { resolveToEmbeds } from "../../discord/resolvers/resolveToEmbeds.js";
import type { MoveDirectionOutputType } from "../commands/map/MoveDirection.js";
import type { IChannel } from "../repo/base/IdRepository.js";
import type { Bot } from "./Bot.js";
import type { Game } from "./Game.js";
import type { GameCharacter } from "./GameCharacter.js";
import { ColorType, type IHasColorsCore } from "./HasColorsCore.js";
import type { EmojiType } from "./HasEmojiCore.js";
import { ReplyStack } from "./ReplyStack.js";
import type { SageCommandArgs } from "./SageCommandArgs.js";
import type { SageEventCache } from "./SageEventCache.js";
import type { SageInteraction } from "./SageInteraction.js";
import type { SageMessage } from "./SageMessage.js";
import type { SageReaction } from "./SageReaction.js";
import { GameCreatorType, type Server } from "./Server.js";
import type { User } from "./User.js";

type ValidatedPermissions = {
	canCreateGames: boolean;
	canManageGame: boolean;
	canManageGames: boolean;
	canManageServer: boolean;
};

export interface SageCommandCore {
	eventCache: SageEventCache;
}

export type TSendArgs<HasEphemeral extends boolean = boolean> = {
	content?: RenderableContentResolvable;
	embeds?: RenderableContentResolvable | EmbedBuilder[];
	components?: ActionRowBuilder<StringSelectMenuBuilder | ButtonBuilder>[];
	ephemeral?: If<HasEphemeral, boolean | null, never>;
	files?: AttachmentBuilder[];
};

export type TSendOptions<HasEphemeral extends boolean = boolean> = {
	content?: string;
	embeds?: EmbedBuilder[];
	components?: ActionRowBuilder<StringSelectMenuBuilder | ButtonBuilder>[];
	ephemeral?: If<HasEphemeral, boolean | null, never>;
	files?: AttachmentBuilder[];
};

export type IdPartsBase = {
	/** Generally the tool or feature of Sage */
	indicator: string;
	/** The action being performed. */
	action: string;
};

type CustomIdParser<T extends IdPartsBase> = (customId: string) => T | undefined;

export abstract class SageCommand<
			T extends SageCommandCore = any,
			U extends SageCommandArgs<any> = SageCommandArgs<any>
			> extends HasCache {

	protected constructor(protected core: T, cache?: Cache | null) {
		super(cache as Cache);
	}

	public abstract commandValues: string[];
	public abstract isCommand(...args: string[]): boolean;

	public getModalForm<T>(): T | undefined {
		if (this.isSageInteraction("MODAL")) {
			const form = { } as { [key:string]: string | undefined; };
			this.interaction.fields.fields.forEach(comp => {
				form[comp.customId] = stringOrUndefined(comp.value);
			});
			return form as T;
		}

		const keys = this.args.keys();
		if (keys.length) {
			const form = { } as { [key:string]: Optional<string>; };
			keys.forEach(key => {
				form[key] = this.args.getString(key);
			});
			return form as T;
		}

		return undefined;
	}

	public isSageInteraction(type: "BUTTON"): this is SageInteraction<ButtonInteraction>;
	public isSageInteraction(type: "SELECT"): this is SageInteraction<StringSelectMenuInteraction>;
	public isSageInteraction(type: "MESSAGE"): this is SageInteraction<ButtonInteraction | StringSelectMenuInteraction>;
	public isSageInteraction(type: "TEXT"): this is SageInteraction<MessageComponentInteraction>;
	public isSageInteraction(type: "COMPONENT"): this is SageInteraction<MessageComponentInteraction>;
	public isSageInteraction(type: "AUTO"): this is SageInteraction<AutocompleteInteraction>;
	public isSageInteraction(type: "MODAL"): this is SageInteraction<ModalSubmitInteraction>;
	public isSageInteraction(type: "SLASH"): this is SageInteraction<CommandInteraction>;
	public isSageInteraction(type: "MSG_CONTEXT"): this is SageInteraction<MessageContextMenuCommandInteraction>;
	public isSageInteraction(type: "USR_CONTEXT"): this is SageInteraction<UserContextMenuCommandInteraction>;
	public isSageInteraction(type: "CONTEXT"): this is SageInteraction<MessageContextMenuCommandInteraction | UserContextMenuCommandInteraction>;
	public isSageInteraction<T extends DRepliableInteraction>(type: "REPLIABLE"): this is SageInteraction<T>;
	public isSageInteraction<T extends DInteraction = any>(): this is SageInteraction<T>;
	public isSageInteraction(type?: "AUTO" | "MODAL" | "SLASH" | "BUTTON" | "SELECT" | "MESSAGE" | "TEXT" | "COMPONENT" | "REPLIABLE" | "MSG_CONTEXT" | "USR_CONTEXT" | "CONTEXT"): boolean {
		if ("interaction" in this) {
			if (!type) {
				return true;
			}

			const interaction = this.interaction as DInteraction;

			if (type === "REPLIABLE") {
				return interaction.isRepliable();
				// return "reply" in interaction;
			}

			if (type === "CONTEXT") {
				return interaction.isContextMenuCommand();
			}
			if (type === "MSG_CONTEXT") {
				return interaction.isMessageContextMenuCommand();
			}
			if (type === "USR_CONTEXT") {
				return interaction.isUserContextMenuCommand();
			}

			// InteractionType
			if (["AUTO", "MODAL", "SLASH"].includes(type)) {
				switch(type) {
					case "AUTO": return interaction.type === InteractionType.ApplicationCommandAutocomplete;
					case "MODAL": return interaction.type === InteractionType.ModalSubmit;
					case "SLASH": return interaction.type === InteractionType.ApplicationCommand;
				}

			// MessageComponentType
			}else if ("componentType" in interaction && ["BUTTON", "MESSAGE", "SELECT"].includes(type)) {
				switch(type) {
					case "BUTTON": return interaction.componentType === ComponentType.Button;
					case "MESSAGE": return interaction.componentType === ComponentType.Button || interaction.componentType === ComponentType.StringSelect;
					case "SELECT": return interaction.componentType === ComponentType.StringSelect;
				}

			}
		}
		return false;
	}
	public isSageMessage(): this is SageMessage { return "hasPrefix" in this; }
	public isSageReaction(): this is SageReaction { return "messageReaction" in this; }

	private _replyStack: ReplyStack | undefined;
	public get replyStack(): ReplyStack { return this._replyStack ?? (this._replyStack = new ReplyStack(this)); }

	//#region abstract

	public abstract args: U;

	/** @todo: THIS IS NOT A PERMANENT SOLUTION; REPLACE THIS WHEN WE START PROPERLY TRACKING MESSAGES/DICE! */
	public clone(): this { return this; }

	public abstract fetchMessage(messageId?: Snowflake): Promise<Message | undefined>;

	/** @todo what is the reason for both reply /AND/ whisper? */
	public abstract reply(renderableOrArgs: RenderableContentResolvable | TSendArgs, ephemeral?: boolean): Promise<void>;

	/** @todo what is the reason for both reply /AND/ whisper? */
	public abstract whisper(renderableOrArgs: RenderableContentResolvable | TSendArgs): Promise<void>;

	public async whisperWikiHelp(...pages: { isHelp?:boolean; message?:string; page:string; label?:string; }[]): Promise<void> {
		const notValidText = `The command you attempted isn't valid.`;
		const content = pages.filter(isDefined).map(({ isHelp, message, page, label }) => {
			const notValidMessage = isHelp === false ? notValidText : ``;
			const url = `https://github.com/rpg-sage-creative/rpg-sage/wiki/${page.replace(/ /g, "-")}`;
			const seeHelp = `- Please see Help for [${label ?? page.replace(/-/g, " ")}](<${url}>).`;
			return `${notValidMessage ?? ""}\n${message ?? ""}\n${seeHelp}`.replace(/\n+/g, "\n").trim();
		}).join("\n");
		return this.whisper(content);
	}

	//#endregion

	//#region caches

	/** eventCache.actor */
	public get actor() { return this.eventCache.actor; }
	/** eventCache.bot */
	public get bot(): Bot { return this.eventCache.bot; }
	/** eventCache.discord */
	public get discord(): DiscordCache { return this.eventCache.discord; }
	public get eventCache(): SageEventCache { return this.core.eventCache; }
	/** eventCache.game */
	public get game(): Game | undefined { return this.eventCache.game; }
	/** @deprecated SageCache has been renamed SageEventCache and .sageCache is now .eventCache */
	public get sageCache(): SageEventCache { return this.core.eventCache; }
	/** eventCache.actor.sage */
	public get sageUser(): User { return this.eventCache.actor.sage; }
	/** eventCache.server?.sage */
	public get server(): Server | undefined { return this.eventCache.server?.sage; }

	//#endregion


	// #region User flags

	/** The user interacting with Sage. */
	public get actorId(): Snowflake {
		return this.eventCache.actor.sage.did;
	}

	/** @deprecated use await validatePermission("canManageServer") */
	public get canManageServer(): boolean {
		const { cache } = this;

		// check that it is cached
		if (cache.get<ValidatedPermissions>("validatedPermissions")?.canManageServer) return true;

		const { actor, server } = this.eventCache;
		return !!(server.known && actor.canManageServer);
	}

	// #endregion

	// #region Permission Flags

	public async validatePermissions(): Promise<ValidatedPermissions> {
		return this.cache.getOrFetch("validatedPermissions", async () => {
			const actor = await this.eventCache.validateActor();
			const server = await this.eventCache.validateServer();
			const game = this.game;

			const canManageGames =  !!(server.known && actor.canManageGames);
			const canManageServer = !!(server.known && actor.canManageServer);
			const canCreateGames =  !!(server.known && actor.canCreateGames);

			const canManageGame = !!(game && (canManageGames || actor.isGameMaster));

			return {
				canCreateGames,
				canManageGame,
				canManageGames,
				canManageServer,
			};
		});
	}

	public async validatePermission(key: keyof ValidatedPermissions): Promise<boolean> {
		const perms = await this.validatePermissions();
		return perms[key];
	}

	/** Quick flag for Sage admins (isSuperUser || isOwner || isSageAdmin) */
	public get canAdminSage(): boolean {
		const { cache } = this;
		return cache.get<ValidatedPermissions>("validatedPermissions")?.canManageServer
			?? cache.getOrSet("canAdminSage", () => !!this.actor.canManageServer);
	}

	/** Quick flag for Game admins (canAdminServer || isGameAdmin) */
	public get canAdminGames(): boolean {
		const { cache } = this;
		return cache.get<ValidatedPermissions>("validatedPermissions")?.canManageGames
			?? cache.getOrSet("canAdminGames", () => !!this.actor.canManageGames);
	}

	/** Some servers want anybody to be able to create a Game without needing to setup permissions. */
	public get canCreateGames(): boolean {
		return this.cache.getOrSet("canCreateGames", () => {
			const { server } = this;

			// no server, no games
			if (!server) return false;

			// owner/admin/manage always
			if (this.canManageServer) return true;

			const { gameCreatorType } = server;

			// if no then no; this explicit NO overrides canAdminGames
			if (gameCreatorType === GameCreatorType.None) return false;

			// if any then any; this explicit YES overrides canAdminGames
			if (gameCreatorType === GameCreatorType.Any) return true;

			// if you can admin games, you can create games
			if (this.canAdminGames) return true;

			return false;
		});
	}

		/** Ensures we are either in the channel being targeted or we are in an admin channel. */
	public testChannelAdmin(channelDid: Optional<Snowflake>): boolean {
		/** @todo: figure out if i even need this or if there is a better way */
		return channelDid === this.channelDid || ![SageChannelType.None, SageChannelType.Dice].includes(this.channel?.type!);
	}

	/** Ensures we have a game and can admin games or are the GM. */
	public testGameAdmin(game: Optional<Game>): game is Game {
		return !!game && (this.canAdminGames || game.hasGameMaster(this.actorId));
	}

	/** Ensures we are either in an admin channel or are the server owner or SuperUser. @deprecated find a better way involving validatePermissions() */
	public testServerAdmin(): boolean {
		return this.canManageServer || this.actor.sage.isSuperUser || ![SageChannelType.None, SageChannelType.Dice].includes(this.serverChannel?.type!);
	}

	// #endregion

	// #region Function flags

	public get allowCommand(): boolean {
		return this.cache.getOrSet("allowCommand", () => {
			const channel = this.channel;
			// allow all in unconfigured channels
			if (!channel) {
				return true;
			}

			const blockedTypes = [SageChannelType.None, SageChannelType.InCharacter];

			// we only stop commands in None or InCharacter
			if (!blockedTypes.includes(channel.type!)) {
				return true;
			}

			if (this.game) {
				//  we need to make sure the game isn't all blocked channels
				const gameChannels = this.game?.channels;
				const othersNotBlocked = gameChannels?.some(channel => !blockedTypes.includes(channel.type!));
				return !othersNotBlocked;
			}

			// blocked
			return false;
		});
	}

	public get allowDialog(): boolean {
		return this.cache.getOrSet("allowDialog", () => !this.channel || ![SageChannelType.None,SageChannelType.Dice].includes(this.channel.type!));
	}

	public get allowDice(): boolean {
		return this.cache.getOrSet("allowDice", () => !this.channel || this.channel.type !== SageChannelType.None);
	}

	public get dialogPostType(): DialogPostType {
		return this.cache.getOrSet("dialogPostType", () => this.sageUser?.dialogPostType ?? this.gameChannel?.dialogPostType ?? this.game?.dialogPostType ?? this.serverChannel?.dialogPostType ?? this.server?.dialogPostType ?? 0);
	}

	// #endregion

	//#region channels

	public get dChannel(): Exclude<TextBasedChannel, PartialGroupDMChannel> | undefined {
		return this.isSageInteraction<CommandInteraction>()
			? this.interaction.channel as Exclude<TextBasedChannel, PartialGroupDMChannel> ?? undefined
			: (this as unknown as SageMessage).message?.channel;
	}

	/** Returns the gameChannel meta, or the serverChannel meta if no gameChannel exists. */
	public get channel(): IChannel | undefined {
		return this.cache.getOrSet("channel", () => {
			debug(`caching sageCommand.channel ${this.dChannel?.id}`);
			return this.gameChannel ?? this.serverChannel;
		});
	}

	/** Returns the gameChannel meta for the message, checking the thread before checking its channel. */
	public get gameChannel(): IChannel | undefined {
		return this.cache.getOrSet("gameChannel", () =>
			this.game?.getChannel(this.threadDid)
			?? this.game?.getChannel(this.channelDid)
		);
	}

	/** Returns the serverChannel meta for the message, checking the thread before checking its channel. */
	public get serverChannel(): IChannel | undefined {
		return this.cache.getOrSet("serverChannel", () =>
			this.server?.getChannel(this.threadDid)
			?? this.server?.getChannel(this.channelDid)
		);
	}

	/** @deprecated Returns the channel id this message (or interaction) is in. */
	public get channelDid(): Snowflake | undefined {
		return this.cache.getOrSet("channelDid", () => {
			/** @todo investigate the notes found in threadDid below */
			if (this.dChannel?.isThread()) {
				return this.dChannel.parentId as Snowflake;
			}
			return this.dChannel?.id as Snowflake;
		});
	}

	/** @deprecated Returns the thread id this message (or interaction) is in. */
	public get threadDid(): Snowflake | undefined {
		return this.cache.getOrSet("threadDid", () => {
			if (this.dChannel?.isThread()) {
				return this.dChannel.id as Snowflake;
			}
			return undefined;
		});
	}

	/** @deprecated Returns the thread id (if exists) or channel id (if no thread) this message (or interaction) is in. */
	public get threadOrChannelDid(): Snowflake | undefined {
		return this.cache.getOrSet("threadOrChannelDid", () => this.threadDid ?? this.channelDid ?? this.dChannel?.id as Snowflake);
	}

	//#endregion

	//#region characters

	/**
	 * Gets the active player character by checking the following list:
	 * 1. Game PC for user with auto dialog in this channel
	 * 2. Game PC for user
	 * 3. Non-Game PC for user with auto dialog in this channel
	 */
	public get playerCharacter(): GameCharacter | undefined {
		return this.cache.getOrSet("playerCharacter", () => {
			const channelDid = this.channel?.id as Snowflake;
			const userDid = this.sageUser?.did;
			if (!userDid) return undefined;
			const autoChannelData = { channelDid, userDid };
			return this.game?.playerCharacters.getAutoCharacter(autoChannelData)
				?? this.game?.playerCharacters.findByUser(userDid)
				?? this.sageUser.playerCharacters.getAutoCharacter(autoChannelData);
		});
	}

	public get gmCharacter(): GameCharacter | undefined {
		return this.cache.getOrSet("gmCharacter", () =>
			this.game?.gmCharacter ?? this.server?.gmCharacter
		);
	}

	/**
	 * Looks for a Character with the given name or alias by checking the Game (if one exists) before checking the SageUser.
	 * PCs (and then Companions) are checked before NPCs (and then Minions).
	 */
	public findCharacter(value: string): GameCharacter | undefined {
		const find = ({ playerCharacters, nonPlayerCharacters }: Game | User) => {
			return playerCharacters.findByName(value)
				?? playerCharacters.findCompanion(value)
				?? nonPlayerCharacters.findByName(value)
				?? nonPlayerCharacters.findCompanion(value);
		};

		const { game, server } = this;
		if (game) {
			if (game.gmCharacter.matches(value)) {
				return game.gmCharacter;
			}
			const gameChar = find(game);
			if (gameChar) return gameChar;

		}else if (server) {
			if (server.gmCharacter.matches(value)) {
				return server.gmCharacter;
			}
		}
		return this.sageUser ? find(this.sageUser) : undefined;
	}

	//#endregion

	//#region colors

	/** Returns the object with the correct color scheme for the current command. */
	public getHasColors(): IHasColorsCore {
		return this.game ?? this.server ?? this.bot;
	}

	// public colors = this.game?.colors ?? this.server?.colors ?? this.bot.colors;

	/** Gets the correct color by working up the "ladder" of color heirarchy. */
	public toHexColorString(colorType: Optional<ColorType>): HexColorString | undefined {
		if (!colorType) {
			return undefined;
		}
		if (this.game) {
			return this.game.toHexColorString(colorType);
		}
		if (this.server) {
			return this.server.toHexColorString(colorType);
		}
		return this.bot.toHexColorString(colorType);
	}

	// #endregion

	//#region emoji

	/** Get the given emoji, checking first the game, then server, then the bot. */
	public getEmoji(emojiType: EmojiType): string | null {
		return this.game?.emoji.get(emojiType)
			?? this.server?.emoji.get(emojiType)
			?? this.bot.emoji.get(emojiType);
	}

	//#endregion

	//#region dice settings

	public get gameSystemType(): GameSystemType {
		return this.cache.getOrSet("gameType", () => this.game?.gameSystemType ?? this.serverChannel?.gameSystemType ?? this.server?.gameSystemType ?? 0);
	}

	public get diceCritMethodType(): DiceCriticalMethodType {
		return this.cache.getOrSet("diceCritMethodType", () => {
			const diceCritMethodType = this.gameChannel?.diceCritMethodType
				?? this.game?.diceCritMethodType
				?? this.serverChannel?.diceCritMethodType
				?? this.server?.diceCritMethodType;
			if (diceCritMethodType !== undefined) {
				return diceCritMethodType;
			}
			return parseGameSystem(this.gameSystemType)?.diceCritMethodType
				?? 0;
		});
	}

	public get dicePostType(): DicePostType {
		return this.cache.getOrSet("dicePostType", () => this.gameChannel?.dicePostType ?? this.game?.dicePostType ?? this.serverChannel?.dicePostType ?? this.server?.dicePostType ?? 0);
	}

	public get diceOutputType(): DiceOutputType {
		return this.cache.getOrSet("diceOutputType", () => this.gameChannel?.diceOutputType ?? this.game?.diceOutputType ?? this.serverChannel?.diceOutputType ?? this.server?.diceOutputType ?? 0);
	}

	public get diceSecretMethodType(): DiceSecretMethodType {
		return this.cache.getOrSet("diceSecretMethodType", () => this.gameChannel?.diceSecretMethodType ?? this.game?.diceSecretMethodType ?? this.serverChannel?.diceSecretMethodType ?? this.server?.diceSecretMethodType ?? 0);
	}

	public get diceSortType(): DiceSortType {
		return this.cache.getOrSet("diceSortType", () => this.gameChannel?.diceSortType ?? this.game?.diceSortType ?? this.serverChannel?.diceSortType ?? this.server?.diceSortType ?? 0);
	}

	public get moveDirectionOutputType(): MoveDirectionOutputType {
		return this.cache.getOrSet("moveDirectionOutputType", () => this.game?.moveDirectionOutputType ?? this.sageUser?.moveDirectionOutputType ?? 0);
	}

	//#endregion

	//#region games

	/** @deprecated use actor.isGameMaster */
	public get isGameMaster() { return this.eventCache.actor.isGameMaster === true; }
	/** @deprecated use actor.isGamePlayer */
	public get isPlayer() { return this.eventCache.actor.isGamePlayer === true; }

	//#endregion

	/** @todo figure out where splitMessageOptions comes into this workflow */
	public resolveToOptions<T extends TSendOptions>(renderableOrArgs: RenderableContentResolvable | TSendArgs, _ephemeral?: boolean): T {
		if ((typeof(renderableOrArgs) === "string") || ("toRenderableContent" in renderableOrArgs)) {
			return {
				embeds: resolveToEmbeds(this.eventCache, renderableOrArgs),
				ephemeral: false
				// ephemeral: ephemeral
			} as T;
		}

		const options: TSendOptions = { };
		if (renderableOrArgs.content) {
			options.content = typeof(renderableOrArgs.content) === "string"
				? renderableOrArgs.content
				: resolveToContent(this.eventCache, renderableOrArgs.content).join("\n");
		}
		if (renderableOrArgs.embeds) {
			options.embeds = Array.isArray(renderableOrArgs.embeds)
				? renderableOrArgs.embeds
				: resolveToEmbeds(this.eventCache, renderableOrArgs.embeds);
		}
		if (renderableOrArgs.components) {
			options.components = renderableOrArgs.components;
		}
		if (renderableOrArgs.files) {
			options.files = renderableOrArgs.files;
		}
		options.ephemeral = false;
		// options.ephemeral = (ephemeral ?? renderableOrArgs.ephemeral) === true;
		return options as T;
	}

	public getLocalizer() {
		return this.eventCache.getLocalizer();
	}

	public createRenderable(colorType: ColorType, title?: string): RenderableContent {
		const renderableContent = new RenderableContent(title);
		renderableContent.setColor(this.getHasColors().toHexColorString(colorType));
		return renderableContent;
	}
	public createAdminRenderable(title?: LocalizedTextKey, ...args: any[]): RenderableContent {
		const localized = title ? this.getLocalizer()(title, ...args) : undefined;
		return this.createRenderable(ColorType.AdminCommand, localized);
	}

	//#region customId

	public customIdMatches(_valueOrRegex: string | RegExp): boolean {
		return false;
	}

	public parseCustomId<T extends IdPartsBase>(_parser?: CustomIdParser<T>): T | undefined {
		return undefined;
	}

	//#endregion
}
