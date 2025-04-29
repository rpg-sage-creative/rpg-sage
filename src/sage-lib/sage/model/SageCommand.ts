import { DialogPostType, DiceCritMethodType, DiceOutputType, DicePostType, DiceSecretMethodType, DiceSortType, GameSystemType, parseGameSystem, SageChannelType } from "@rsc-sage/types";
import { Cache, debug, HasCache, isDefined, orNilSnowflake, RenderableContent, type Optional, type RenderableContentResolvable, type Snowflake } from "@rsc-utils/core-utils";
import type { DInteraction, DiscordCache, DiscordKey, DRepliableInteraction, EmbedBuilder } from "@rsc-utils/discord-utils";
import { stringOrUndefined } from "@rsc-utils/string-utils";
import { ComponentType, InteractionType, Message, MessageContextMenuCommandInteraction, UserContextMenuCommandInteraction, type ActionRowBuilder, type AttachmentBuilder, type AutocompleteInteraction, type ButtonBuilder, type ButtonInteraction, type CommandInteraction, type HexColorString, type If, type MessageComponentInteraction, type ModalSubmitInteraction, type StringSelectMenuBuilder, type StringSelectMenuInteraction, type TextBasedChannel } from "discord.js";
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
import type { SageCache } from "./SageCache.js";
import type { SageCommandArgs } from "./SageCommandArgs.js";
import type { SageInteraction } from "./SageInteraction.js";
import type { SageMessage } from "./SageMessage.js";
import type { SageReaction } from "./SageReaction.js";
import type { Server } from "./Server.js";
import type { User } from "./User.js";

export interface SageCommandCore {
	sageCache: SageCache;

	isGameMaster?: boolean;
	isPlayer?: boolean;
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

	/** @deprecated use .sageCache */
	public get caches(): SageCache { return this.core.sageCache; }
	public get bot(): Bot { return this.sageCache.bot; }
	public get discord(): DiscordCache { return this.sageCache.discord; }
	public get discordKey(): DiscordKey { return this.sageCache.discordKey; }
	public get game(): Game | undefined { return this.sageCache.game; }
	public get sageCache(): SageCache { return this.core.sageCache; }
	public get sageUser(): User { return this.sageCache.user; }
	public get server(): Server { return this.sageCache.server; }

	//#endregion


	// #region User flags

	/** The user interacting with Sage. */
	public get actorId(): Snowflake {
		return this.cache.getOrSet("actorId", () => orNilSnowflake(this.sageCache.actor?.id ?? this.sageCache.user.did));
	}
	/** @deprecated use .actorId or .sageCache.actor or .sageCache.author */
	public get authorDid(): Snowflake {
		return this.cache.getOrSet("authorDid", () => orNilSnowflake(this.sageCache.user.did));
	}

	/** @deprecated Is the author the owner of the message's server */
	public get isOwner(): boolean {
		return this.cache.getOrSet("isOwner", () => {
			if (this.isSageInteraction()) {
				return this.interaction.guild?.ownerId === this.authorDid;
			}else if (this.isSageMessage() || this.isSageReaction()) {
				return this.message.guild?.ownerId === this.authorDid;
			}
			return false;
		});
	}

	public get canManageServer(): boolean {
		// check that it is cached
		if (this.cache.get("canManageServer")) return true;
		// if we have an actor, we can cache the results
		if (this.sageCache.actor) {
			return this.cache.getOrSet("canManageServer", () => {
				return this.sageCache.actor!.canManageServer;
			});
		}
		// revert to isOwner
		return this.isOwner;
	}

	/** Returns true if the acting user is the server owner, a server administrator, or has the manage server permission. */
	public checkCanManageServer(): Promise<boolean> {
		return this.cache.getOrFetch("canManageServer", async () => {
			if (await this.sageCache.ensureActor()) {
				return this.sageCache.actor?.canManageServer ?? false;
			}
			return false;
		});
	}

	/** Can admin Sage settings, Server channels, Games, and Game channels */
	public get isSageAdmin(): boolean {
		return this.cache.getOrSet("isSageAdmin", () => (this.authorDid && this.server?.hasSageAdmin(this.authorDid)) === true);
	}

	/** Can admin Server channels and Game channels */
	public get isServerAdmin(): boolean {
		return this.cache.getOrSet("isServerAdmin", () => (this.authorDid && this.server?.hasServerAdmin(this.authorDid)) === true);
	}

	/** Can admin Games and Game channels */
	public get isGameAdmin(): boolean {
		return this.cache.getOrSet("isGameAdmin", () => (this.authorDid && this.server?.hasGameAdmin(this.authorDid)) === true);
	}

	// #endregion

	// #region Permission Flags

	/** Quick flag for Sage admins (isSuperUser || isOwner || isSageAdmin) */
	public get canAdminSage(): boolean {
		return this.cache.getOrSet("canAdminSage", () => !!this.server && (this.isSuperUser || this.canManageServer || this.isSageAdmin));
	}

	/** Quick flag for Server admins (canAdminSage || isServerAdmin) */
	public get canAdminServer(): boolean {
		return this.cache.getOrSet("canAdminServer", () => this.canAdminSage || (!!this.server && this.isServerAdmin));
	}

	/** Quick flag for Game admins (canAdminServer || isGameAdmin) */
	public get canAdminGames(): boolean {
		return this.cache.getOrSet("canAdminGames", () => this.canAdminServer || this.isGameAdmin);
	}

	/** Quick flag for "this" Game (game && (canAdminGames || isGameMaster)) */
	public get canAdminGame(): boolean {
		return this.cache.getOrSet("canAdminGame", () => !!this.game && (this.canAdminGames || this.isGameMaster));
	}

	// #endregion

	// #region Function flags

	/** @deprecated Use .allowCommand */
	public get allowAdmin(): boolean {
		return this.allowCommand;
	}

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

	/** @deprecated Use .allowCommand */
	public get allowSearch(): boolean {
		return this.allowCommand;
	}

	public get dialogPostType(): DialogPostType {
		return this.cache.getOrSet("dialogPostType", () => this.sageUser.dialogPostType ?? this.gameChannel?.dialogPostType ?? this.game?.dialogPostType ?? this.serverChannel?.dialogPostType ?? this.server?.dialogPostType ?? 0);
	}

	// #endregion

	//#region channels

	public get dChannel(): TextBasedChannel | undefined {
		return this.isSageInteraction<CommandInteraction>()
			? this.interaction.channel ?? undefined
			: (this as unknown as SageMessage).message.channel;
	}

	/** Returns the gameChannel meta, or the serverChannel meta if no gameChannel exists. */
	public get channel(): IChannel | undefined {
		return this.cache.getOrSet("channel", () => {
			debug(`caching sageCommand.channel ${this.discordKey.channelId}`);
			return this.gameChannel ?? this.serverChannel;
		});
	}

	/** Returns the gameChannel meta for the message, checking the thread before checking its channel. */
	public get gameChannel(): IChannel | undefined {
		return this.cache.getOrSet("gameChannel", () => this.game?.getChannel(this.discordKey));
	}

	/** Returns the serverChannel meta for the message, checking the thread before checking its channel. */
	public get serverChannel(): IChannel | undefined {
		return this.cache.getOrSet("serverChannel", () => this.server?.getChannel(this.discordKey));
	}

	/** Returns the channelDid this message (or its thread) is in. */
	public abstract channelDid: Snowflake | undefined;

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
			const userDid = this.sageUser.did;
			const autoChannelData = { channelDid, userDid };
			return this.game?.playerCharacters.getAutoCharacter(autoChannelData)
				?? this.game?.playerCharacters.findByUser(userDid)
				?? this.sageUser.playerCharacters.getAutoCharacter(autoChannelData);
		});
	}

	public get gmCharacter(): GameCharacter {
		return this.cache.getOrSet("gmCharacter", () =>
			this.game?.gmCharacter ?? this.server.gmCharacter
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
		return find(this.sageUser);
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

	public get diceCritMethodType(): DiceCritMethodType {
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
		return this.cache.getOrSet("moveDirectionOutputType", () => this.game?.moveDirectionOutputType ?? this.sageUser.moveDirectionOutputType ?? 0);
	}

	//#endregion

	//#region flags

	/** Is the server HomeServer */
	public get isHomeServer(): boolean {
		return this.server?.isHome === true;
	}

	/** Is the author SuperUser */
	public get isSuperUser(): boolean {
		return this.sageUser.isSuperUser === true;
	}
	/** Is the author SuperAdmin or SuperUser */
	public get canSuperAdmin(): boolean {
		return this.sageUser.isSuperAdmin || this.sageUser.isSuperUser;
	}

	//#endregion

	//#region games

	public get isGameMaster() { return this.core.isGameMaster === true; }
	public set isGameMaster(bool: boolean) { this.core.isGameMaster = bool === true; }

	public get isPlayer() { return this.core.isPlayer === true; }
	public set isPlayer(bool: boolean) { this.core.isPlayer = bool === true; }

	//#endregion

	/** @todo figure out where splitMessageOptions comes into this workflow */
	public resolveToOptions<T extends TSendOptions>(renderableOrArgs: RenderableContentResolvable | TSendArgs, _ephemeral?: boolean): T {
		if ((typeof(renderableOrArgs) === "string") || ("toRenderableContent" in renderableOrArgs)) {
			return {
				embeds: resolveToEmbeds(this.sageCache, renderableOrArgs),
				ephemeral: false
				// ephemeral: ephemeral
			} as T;
		}

		const options: TSendOptions = { };
		if (renderableOrArgs.content) {
			options.content = typeof(renderableOrArgs.content) === "string"
				? renderableOrArgs.content
				: resolveToContent(this.sageCache, renderableOrArgs.content).join("\n");
		}
		if (renderableOrArgs.embeds) {
			options.embeds = Array.isArray(renderableOrArgs.embeds)
				? renderableOrArgs.embeds
				: resolveToEmbeds(this.sageCache, renderableOrArgs.embeds);
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
		return this.sageCache.getLocalizer();
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
