import type * as Discord from "discord.js";
import { LogLevel, TConsoleCommandType } from "../../../sage-utils";
import { HasDidCore, type DidCore } from "../repo/base/DidRepository";
import Colors from "./Colors";
import Emoji from "./Emoji";
import type { ColorType, IHasColors, IHasColorsCore } from "./HasColorsCore";
import type { EmojiType, IHasEmoji, IHasEmojiCore } from "./HasEmojiCore";
import type SageCache from "./SageCache";
import type { GameType } from "../../../sage-common";

export type TBotCodeName = "dev" | "beta" | "stable";

export type TCoreAuthor = { iconUrl?: string; name?: string; url?: string; };
export type TCorePrefixes = { command?: string; search?: string; };

export type TDev = { did: Discord.Snowflake; logLevel: TConsoleCommandType; };

/**
 * key = GameType
 * undefined | false = no search for this game
 * string = description for why search is disabled for this game
 * true = search is enabled for this game
 */
type TSearchStatus = { [key: number]: undefined | boolean | string; };

export interface IBotCore extends DidCore<"Bot">, IHasColors, IHasEmoji {
	codeName: TBotCodeName;
	commandPrefix?: string;
	devs?: TDev[];
	logLevel: TConsoleCommandType;

	/** Discord API bot token */
	token: string;

	/** Url to the Sage avatar/token. */
	tokenUrl: string;

	/** Current status of the search engine by game. */
	searchStatus: TSearchStatus;
}

export default class Bot extends HasDidCore<IBotCore> implements IHasColorsCore, IHasEmojiCore {
	public constructor(core: IBotCore, sageCache: SageCache) { super(core, sageCache); }
	public get codeName(): TBotCodeName { return this.core.codeName; }
	public get commandPrefix(): string { return this.core.commandPrefix ?? "sage"; }
	public get devs(): TDev[] { return this.core.devs ?? []; }
	public get logLevel(): LogLevel { return LogLevel[<keyof typeof LogLevel>this.core.logLevel] || null; }
	public get token(): string { return this.core.token; }
	public get tokenUrl(): string { return this.core.tokenUrl ?? "https://rpgsage.io/SageBotToken.png"; }

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
	public colors = new Colors(this.core.colors || (this.core.colors = []));
	public toDiscordColor(colorType: ColorType): string | null {
		if (!this.core.colors.length) {
			console.warn(`Colors Missing: Bot (${this.codeName || this.id})`);
			return null;
		}
		return this.colors.toDiscordColor(colorType);
	}
	// #endregion

	// #region IHasEmoji
	public emoji = new Emoji(this.core.emoji ?? (this.core.emoji = []));
	public emojify(text: string): string {
		return this.emoji.emojify(text);
	}
	public getEmoji(emojiType: EmojiType): string | null {
		return this.emoji.get(emojiType) ?? null;
	}
	// #endregion

}
