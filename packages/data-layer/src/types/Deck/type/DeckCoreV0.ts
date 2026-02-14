import type { Snowflake } from "@rsc-utils/core-utils";
import type { DeckType, SageCore } from "../../other/index.js";

export type DeckCoreV0 = Omit<SageCore<"Deck", Snowflake>, "did"> & {
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