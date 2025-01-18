import { GameSystemType } from "@rsc-sage/types";
import type { Snowflake } from "@rsc-utils/core-utils";
import { warn } from "@rsc-utils/core-utils";
import type { HexColorString } from "discord.js";
import { HasDidCore, type DidCore } from "../repo/base/DidRepository.js";
import { Colors } from "./Colors.js";
import { Emoji } from "./Emoji.js";
import type { ColorType, IHasColors, IHasColorsCore } from "./HasColorsCore.js";
import type { EmojiType, IHasEmoji, IHasEmojiCore } from "./HasEmojiCore.js";
import type { MacroBase } from "./Macro.js";
import type { SageCache } from "./SageCache.js";

export type TBotCodeName = "dev" | "beta" | "stable";

export type TCoreAuthor = { iconUrl?: string; name?: string; url?: string; };
export type TCorePrefixes = { command?: string; search?: string; };

export type TDev = { did: Snowflake; };

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
	// devs?: TDev[];

	/** Discord API bot token */
	token: string;

	/** Url to the Sage avatar/token. */
	tokenUrl: string;

	/** Current status of the search engine by game. */
	searchStatus: TSearchStatus;

	macros?: MacroBase[];
}

export class Bot extends HasDidCore<IBotCore> implements IHasColorsCore, IHasEmojiCore {
	public constructor(core: IBotCore, sageCache: SageCache) { super(core, sageCache); }
	public get codeName(): TBotCodeName { return this.core.codeName; }
	public get commandPrefix(): string { return this.core.commandPrefix ?? "sage"; }
	// public get devs(): TDev[] { return this.core.devs ?? []; }
	public get token(): string { return this.core.token; }
	public get tokenUrl(): string { return this.core.tokenUrl ?? "https://rpgsage.io/SageBotToken.png"; }
	public get macros() { return this.core.macros ?? (this.core.macros = []); }

	/** returns true if we can search the given game */
	public canSearch(gameType: GameSystemType): boolean { return this.core.searchStatus?.[gameType] === true; }
	/** returns string if disabled, true if enabled, or false if gameType not found (no search logic for this game) */
	public getSearchStatus(gameType: GameSystemType): boolean | string {
		const status = this.core.searchStatus?.[gameType];
		return typeof(status) === "string" ? status : status === true;
	}
	public setSearchStatus(gameType: GameSystemType, status: boolean | string): Promise<boolean> {
		const searchStatus = this.core.searchStatus ?? (this.core.searchStatus = {});
		searchStatus[gameType] = status;
		return this.sageCache.bots.write(this);
	}

	// #region IHasColorsCore

	private _colors?: Colors;

	public get colors(): Colors {
		if (!this._colors) {
			this._colors = new Colors(this.core.colors ?? (this.core.colors = []));
		}
		return this._colors;
	}

	public toHexColorString(colorType: ColorType): HexColorString | undefined {
		if (!this.core.colors.length) {
			warn(`Colors Missing: Bot (${this.codeName || this.id})`);
			return undefined;
		}
		return this.colors.toHexColorString(colorType);
	}

	// #endregion

	// #region IHasEmoji

	private _emoji?: Emoji;

	public get emoji(): Emoji {
		if (!this._emoji) {
			this._emoji = new Emoji(this.core.emoji ?? (this.core.emoji = []));
		}
		return this._emoji;
	}

	public emojify(text: string): string {
		return this.emoji.emojify(text);
	}

	public getEmoji(emojiType: EmojiType): string | null {
		return this.emoji.get(emojiType) ?? null;
	}

	// #endregion

}
