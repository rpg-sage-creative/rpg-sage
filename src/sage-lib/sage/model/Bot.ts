import type * as Discord from "discord.js";
import type { GameType } from "../../../sage-common";
import { LogLevel, TConsoleCommandType } from "../../../sage-utils";
import { HasDidCore, type DidCore } from "../repo/base/DidRepository";
import Colors, { ColorType, CoreWithColors, HasCoreWithColors } from "./Colors";
import Emoji, { CoreWithEmoji, EmojiType, HasCoreWithEmoji } from "./Emoji";
import { CoreWithImages, HasCoreWithImages, Images } from "./Images";
import type SageCache from "./SageCache";

export type TAcceptableBot = {
	/** user.id of the bot */
	did: Discord.Snowflake;
	/** name or category of the bot, for example: "SageTest" or "Tupperbox" */
	desc: "Tupperbox";
};

export type TBotCodeName = "dev" | "beta" | "stable";

type TDev = { did: Discord.Snowflake; logLevel: TConsoleCommandType; };

type TBotImageTag = "avatar";

/**
 * key = GameType
 * undefined | false = no search for this game
 * string = description for why search is disabled for this game
 * true = search is enabled for this game
 */
type TSearchStatus = { [key: number]: undefined | boolean | string; };

export interface BotCore extends DidCore<"Bot">, CoreWithColors, CoreWithEmoji, CoreWithImages<TBotImageTag> {

	/** List of bots that we can let through to the handlers. */
	acceptableBots?: TAcceptableBot[];

	/** "dev" | "beta" | "stable" */
	codeName: TBotCodeName;

	/** defaults to "sage" */
	commandPrefix?: string;

	/** list of devs and their log levels */
	devs: TDev[];

	/** defaults to "SageDialogWebhookName" */
	dialogWebhookName?: string;

	/** Used to determine how much logging to perform during execution. */
	logLevel: TConsoleCommandType;

	/** Current status of the search engine by game. */
	searchStatus: TSearchStatus;

	/** Discord API bot token */
	token: string;

}

export default class Bot extends HasDidCore<BotCore> implements HasCoreWithColors, HasCoreWithEmoji, HasCoreWithImages<TBotImageTag> {
	public constructor(core: BotCore, sageCache: SageCache) { super(core, sageCache); }
	public get acceptableBots(): TAcceptableBot[] { return this.core.acceptableBots ?? []; }
	public get avatarUrl(): string { return this.images.getUrl("avatar") ?? "https://rpgsage.io/SageBotToken.png"; }
	public get codeName(): TBotCodeName { return this.core.codeName; }
	public get commandPrefix(): string { return this.core.commandPrefix ?? "sage"; }
	public get devs(): TDev[] { return this.core.devs ?? []; }
	public get dialogWebhookName(): string { return this.core.dialogWebhookName ?? "SageDialogWebhookName"; }
	public get logLevel(): LogLevel { return LogLevel[<keyof typeof LogLevel>this.core.logLevel] || null; }
	public get token(): string { return this.core.token; }

	/** returns true if we can search the given game */
	public canSearch(gameType: GameType): boolean { return this.core.searchStatus?.[gameType] === true; }
	/** returns string if disabled, true if enabled, or false if gameType not found (no search logic for this game) */
	public getSearchStatus(gameType: GameType): boolean | string {
		const status = this.core.searchStatus?.[gameType];
		return typeof(status) === "string" ? status : status === true;
	}
	public setSearchStatus(gameType: GameType, status: boolean | string): Promise<boolean> {
		const searchStatus = this.core.searchStatus ?? (this.core.searchStatus = {});
		searchStatus[gameType] = status;
		return this.sageCache.bots.write(this);
	}

	// #region IHasColorsCore
	public colors = new Colors(this.core.colors ?? (this.core.colors = []));
	public toDiscordColor(colorType: ColorType): string | null {
		if (!this.core.colors.length) {
			console.warn(`Colors Missing: Bot (${this.codeName || this.id})`);
			return null;
		}
		return this.colors.toDiscordColor(colorType);
	}
	// #endregion

	// #region HasCoreWithEmoji
	public emoji = new Emoji(this.core.emoji ?? (this.core.emoji = []));
	public emojify(text: string): string {
		return this.emoji.emojify(text);
	}
	public getEmoji(emojiType: EmojiType): string | null {
		return this.emoji.get(emojiType) ?? null;
	}
	// #endregion

	//#region HasCoreWithImages
	public images = new Images<TBotImageTag>(this.core.images ?? (this.core.images = []));
	//#endregion

}
