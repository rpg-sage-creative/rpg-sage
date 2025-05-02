import { GameSystemType } from "@rsc-sage/types";
import { errorReturnFalse, getCodeName, getDataRoot, HasIdCore, warn, type HexColorString, type IdCore, type Snowflake } from "@rsc-utils/core-utils";
import { fileExists, readJsonFile, writeFile } from "@rsc-utils/io-utils";
import { Colors } from "./Colors.js";
import { Emoji } from "./Emoji.js";
import type { ColorType, IHasColors, IHasColorsCore } from "./HasColorsCore.js";
import type { EmojiType, IHasEmoji, IHasEmojiCore } from "./HasEmojiCore.js";
import type { MacroBase } from "./Macro.js";

export type TBotCodeName = "dev" | "beta" | "stable";

export type TCoreAuthor = { iconUrl?: string; name?: string; url?: string; };
export type TCorePrefixes = { command?: string; search?: string; };

/**
 * key = GameType
 * undefined | false = no search for this game
 * string = description for why search is disabled for this game
 * true = search is enabled for this game
 */
type TSearchStatus = { [key: number]: undefined | boolean | string; };

/** @todo can safely stop using did and uuid and set id as discord snowflake */
export interface BotCore extends IdCore<"Bot">, IHasColors, IHasEmoji {
	codeName: TBotCodeName;
	commandPrefix?: string;

	/** Url to the Sage avatar/token. */
	tokenUrl: string;

	/** Current status of the search engine by game. */
	searchStatus: TSearchStatus;

	macros?: MacroBase[];
}

export class Bot extends HasIdCore<BotCore> implements IHasColorsCore, IHasEmojiCore {
	public constructor(core: BotCore) { super(core); }
	public get codeName(): TBotCodeName { return this.core.codeName; }
	public get commandPrefix(): string { return this.core.commandPrefix ?? "sage"; }
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
		return this.save();
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

	public async save(): Promise<boolean> {
		return Bot.write(this);
	}

	public static async readOrCreate(id: Snowflake): Promise<Bot | undefined> {
		const botPath = `${getDataRoot("sage")}/bots/${id}.json`;
		const exists = await fileExists(botPath);
		if (!exists) {
			const botTemplatePath = `${getDataRoot("sage")}/bots/bot.template.json`;
			const templateCore = await readJsonFile<BotCore>(botTemplatePath);
			if (templateCore) {
				templateCore.id = id;
				templateCore.codeName = getCodeName();
				await Bot.write(templateCore);
			}
		}
		const botCore = await readJsonFile<BotCore>(botPath);
		return botCore ? new Bot(botCore) : undefined;
	}

	public static async write(bot: BotCore | Bot): Promise<boolean> {
		const botPath = `${getDataRoot("sage")}/bots/${bot.id}.json`;
		const formatted = bot.codeName === "dev";
		const core = "toJSON" in bot ? bot.toJSON() : bot;
		return writeFile(botPath, core, true, formatted).catch(errorReturnFalse);
	}
}
