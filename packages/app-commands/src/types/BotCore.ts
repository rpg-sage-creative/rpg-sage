import { type IdCore } from "@rsc-utils/core-utils";

export type TBotCodeName = "dev" | "beta" | "stable";

/**
 * key = GameType
 * undefined | false = no search for this game
 * string = description for why search is disabled for this game
 * true = search is enabled for this game
 */
type TSearchStatus = { [key: number]: undefined | boolean | string; };

export type MacroBase<Category extends string = string> = {
	category?: Category;
	dice?: string;
	dialog?: string;
	name: string;
};

export interface BotCore extends IdCore<"Bot"> {
	codeName: TBotCodeName;
	commandPrefix?: string;

	/** Url to the Sage avatar/token. */
	tokenUrl: string;

	/** Current status of the search engine by game. */
	searchStatus: TSearchStatus;

	macros?: MacroBase[];
}