import { isNotBlank, isSnowflake, sortPrimitive, type Snowflake } from "@rsc-utils/core-utils";
import { assertArray, assertNumber, assertSageCore, assertString, optional, renameProperty } from "../validation/index.js";
import type { DeckType, SageCore } from "./index.js";

export type DeckCoreAny = DeckCore | DeckCoreOld;

export type DeckCoreOld = DeckCore & {
	cardCount: number;
	/** Represents cards that were discarded. */
	discardPile?: number[];
	/** @deprecated Renamed drawPile. */
	drawn?: number[];
	/** Represents face down cards to be drawn from. Stored by cardId. Top of the deck (first drawn) is index 0. */
	drawPile?: number[];
	/** Represents the cards held in hand. */
	hand?: number[];
	messageId?: Snowflake;
	name: string;
	spread?: number[];
	/** Default deck is a 52 card deck */
	type: DeckType;
};

export type DeckCore = Omit<SageCore<"Deck", Snowflake>, "did"> & {
	cardCount: number;
	/** Represents cards that were discarded. */
	discardPile?: number[];
	/** Represents face down cards to be drawn from. Stored by cardId. Top of the deck (first drawn) is index 0. */
	drawPile?: number[];
	/** Represents the cards held in hand. */
	hand?: number[];
	messageId?: Snowflake;
	name: string;
	spread?: number[];
	/** Default deck is a 52 card deck */
	type: DeckType;
};

export const DeckCoreKeys: (keyof DeckCore)[] = [
	"cardCount",
	"discardPile",
	"drawPile",
	"hand",
	"id",
	"messageId",
	"name",
	"objectType",
	"spread",
	"type",
];

export function assertEnglishDeck(core: DeckCore, count: number): boolean {
	const cards = ([] as number[])
		.concat(core.discardPile ?? [])
		.concat(core.drawPile ?? [])
		.concat(core.hand ?? [])
		.concat(core.spread ?? [])
		;
	cards.sort(sortPrimitive);
	return cards.length === count && cards.every((value, index) => value === index);
}

function isPositiveNumber(value: number) { return value > 0; }
function isValidDeck(value: string) { return ["English52","English54"].includes(value); }

const objectType = "Deck";
export function assertDeckCore(core: DeckCoreAny): core is DeckCore {
	if (!assertSageCore<DeckCore>(core, objectType, DeckCoreKeys)) return false;

	const isValidCard = (value: unknown) => typeof(value) === "number" ? value >= 0 && value < core.cardCount : false;

	if (!assertNumber({ core, objectType, key:"cardCount", validator:isPositiveNumber })) return false;
	if (!assertArray({ core, objectType, key:"discardPile", validator:isValidCard, optional })) return false;
	if (!assertArray({ core, objectType, key:"drawPile", validator:isValidCard, optional })) return false;
	if (!assertArray({ core, objectType, key:"hand", validator:isValidCard, optional })) return false;
	if (!assertString({ core, objectType, key:"messageId", validator:isSnowflake, optional })) return false;
	if (!assertString({ core, objectType, key:"name", validator:isNotBlank, optional })) return false;
	if (!assertArray({ core, objectType, key:"spread", validator:isValidCard, optional })) return false;
	if (!assertString({ core, objectType, key:"type", validator:isValidDeck })) return false;
	if (core.type === "English52" && !assertEnglishDeck(core, 52)) return false;
	if (core.type === "English54" && !assertEnglishDeck(core, 54)) return false;

	return true;
}

export function ensureDeckCore(core: DeckCoreOld): DeckCore {
	if ("drawn" in core) {
		if (!("drawPile" in core)) {
			renameProperty({ core, oldKey:"drawn", newKey:"drawPile"});
		}else {
			delete core.drawn;
		}
	}

	if (!core.cardCount) {
		core.cardCount = (core.discardPile?.length ?? 0)
			+ (core.drawPile?.length ?? 0)
			+ (core.hand?.length ?? 0)
			+ (core.spread?.length ?? 0);
	}

	if (core.type === "Default52" as any) core.type = "English52";
	if (core.type === "Default54" as any) core.type = "English54";

	return core;
}