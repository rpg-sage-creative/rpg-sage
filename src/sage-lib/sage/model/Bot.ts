import type { EmbedColorType, EmojiType, GameSystemType, HasEmbedColors, HasEmoji, MacroBase } from "@rsc-sage/data-layer";
import { errorReturnFalse, formatDataFilePath, getCodeName, HasIdCore, warn, type CodeName, type HexColorString, type IdCore, type Snowflake } from "@rsc-utils/core-utils";
import { fileExists, readJsonFile, writeFile } from "@rsc-utils/io-utils";
import { Colors, type HasColorsCore } from "./Colors.js";
import { Emojis, type HasEmojiCore } from "./Emojis.js";

/**
 * key = GameType
 * undefined | false = no search for this game
 * string = description for why search is disabled for this game
 * true = search is enabled for this game
 */
type SearchStatus = { [key: number]: boolean | string | undefined; };

type PathbuilderImportStatus = boolean | string | undefined;

/** @todo can safely stop using did and uuid and set id as discord snowflake */
export interface BotCore extends IdCore<"Bot">, HasEmbedColors, HasEmoji {
	codeName: CodeName;

	commandPrefix?: string;

	macros?: MacroBase[];

	pathbuilderImportStatus?: PathbuilderImportStatus;

	/** Current status of the search engine by game. */
	searchStatus?: SearchStatus;

	/** Url to the Sage avatar/token. */
	tokenUrl: string;
}

export class Bot extends HasIdCore<BotCore> implements HasColorsCore, HasEmojiCore {

	public constructor(core: BotCore) { super(core); }

	public get codeName(): CodeName { return this.core.codeName; }

	public get commandPrefix(): string { return this.core.commandPrefix ?? "sage"; }

		public get macros() { return this.core.macros ??= []; }

	public get tokenUrl(): string { return this.core.tokenUrl ?? "https://rpgsage.io/SageBotToken.png"; }

	//#region Pathbuilder Import Status

	public canPathbuilderImport(): boolean {
		return this.core.pathbuilderImportStatus === true;
	}

	public getPathbuilderImportStatus(): boolean | string {
		const status = this.core.pathbuilderImportStatus;
		return typeof(status) === "string" ? status : status === true;
	}

	public setPathbuilderImportStatus(status: boolean | string): Promise<boolean> {
		this.core.pathbuilderImportStatus = status;
		return this.save();
	}

	//#endregion

	//#region Search Status

	/** returns true if we can search the given game */
	public canSearch(gameType: GameSystemType): boolean {
		return this.core.searchStatus?.[gameType] === true;
	}

	/** returns string if disabled, true if enabled, or false if gameType not found (no search logic for this game) */
	public getSearchStatus(gameType: GameSystemType): boolean | string {
		const status = this.core.searchStatus?.[gameType];
		return typeof(status) === "string" ? status : status === true;
	}

	public setSearchStatus(gameType: GameSystemType, status: boolean | string): Promise<boolean> {
		const searchStatus = this.core.searchStatus ??= {};
		searchStatus[gameType] = status;
		return this.save();
	}

	//#endregion

	// #region HasColorsCore

	private _colors?: Colors;

	public get colors(): Colors {
		return this._colors ??= new Colors(this.core.colors ??= []);
	}

	public toHexColorString(colorType: EmbedColorType): HexColorString | undefined {
		if (!this.core.colors?.length) {
			warn(`Colors Missing: Bot (${this.codeName || this.id})`);
			return undefined;
		}
		return this.colors.toHexColorString(colorType);
	}

	// #endregion

	// #region HasEmoji

	private _emoji?: Emojis;

	public get emoji(): Emojis {
		return this._emoji ??= new Emojis(this.core.emoji ??= []);
	}

	public emojify(text: string): string {
		return this.emoji.emojify(text);
	}

	public getEmoji(emojiType: EmojiType): string | undefined {
		return this.emoji.get(emojiType);
	}

	// #endregion

	public async save(): Promise<boolean> {
		return Bot.write(this);
	}

	public static async readOrCreate(id: Snowflake): Promise<Bot | undefined> {
		const botPath = formatDataFilePath(["sage", "bots"], id);
		const exists = await fileExists(botPath);
		if (!exists) {
			const botTemplatePath = formatDataFilePath(["sage", "bots"], "bot.template.json");
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
		const botPath = formatDataFilePath(["sage", "bots"], bot.id);
		const formatted = bot.codeName === "dev";
		const core = "toJSON" in bot ? bot.toJSON() : bot;
		return writeFile(botPath, core, { makeDir:true, formatted }).catch(errorReturnFalse);
	}
}
