import type { Snowflake } from "@rsc-utils/core-utils";
import type { DeckType, SageCore } from "../index.js";

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
