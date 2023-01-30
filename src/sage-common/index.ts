//#region GameType

export type TGameType = "NONE" | "PF" | "PF1" | "PF1E" | "PF2" | "PF2E" | "SF" | "SF1" | "SF1E" | "DND5E" | "5E";

export enum GameType {
	None = 0,
	/** Pathfinder 1e */
	PF1e = 11,
	/** Pathfinder 2e */
	PF2e = 12,
	/** Starfinder */
	SF1e = 21,
	/** Coyote & Crow */
	CnC = 31,
	/** Dungeons and Dragons 5e */
	DnD5e = 55,
	/** Essence 20 */
	E20 = 41,
	/** Quest */
	Quest = 71
}

const GameTypeMap = {
	"NONE":GameType.None,
	"PF":GameType.PF1e, "PF1":GameType.PF1e, "PF1E":GameType.PF1e,
	"PF2":GameType.PF2e, "PF2E":GameType.PF2e,
	"SF":GameType.SF1e, "SF1":GameType.SF1e, "SF1E":GameType.SF1e,
	"CNC":GameType.CnC,
	"5E":GameType.DnD5e, "DND5E":GameType.DnD5e,
	"E20":GameType.E20, "ESS20":GameType.E20, "ESSENCE20":GameType.E20,
	"QUEST":GameType.Quest
};

export function parseGameType(gameType: string, defaultGameType?: GameType): GameType | undefined {
	return GameTypeMap[<TGameType>String(gameType).toUpperCase()] ?? defaultGameType;
}

//#endregion

//#region Unicode Letters / Numbers

export const UNICODE_ZERO_TO_TEN = ["\u0030\u20E3", "\u0031\u20E3", "\u0032\u20E3", "\u0033\u20E3", "\u0034\u20E3", "\u0035\u20E3", "\u0036\u20E3", "\u0037\u20E3", "\u0038\u20E3", "\u0039\u20E3", "\ud83d\udd1f"];

export const UNICODE_A_TO_Z = ["\ud83c\udde6", "\ud83c\udde7", "\ud83c\udde8", "\ud83c\udde9", "\ud83c\uddea", "\ud83c\uddeb", "\ud83c\uddec", "\ud83c\udded", "\ud83c\uddee", "\ud83c\uddef", "\ud83c\uddf0", "\ud83c\uddf1", "\ud83c\uddf2", "\ud83c\uddf3", "\ud83c\uddf4", "\ud83c\uddf5", "\ud83c\uddf6", "\ud83c\uddf7", "\ud83c\uddf8", "\ud83c\uddf9", "\ud83c\uddfa", "\ud83c\uddfb", "\ud83c\uddfc", "\ud83c\uddfd", "\ud83c\uddfe", "\ud83c\uddff"];

//#endregion
