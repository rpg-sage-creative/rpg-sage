import { isNotBlank, isSnowflake, type Snowflake } from "@rsc-utils/core-utils";
import { assertNumber } from "../../assertions/assertNumber.js";
import { assertArray, assertSageCore, assertString, optional } from "../../assertions/index.js";
import type { DeckType, SageCore } from "../../types/index.js";

export type DeckCoreV1 = Omit<SageCore<"Deck", Snowflake>, "did"> & {
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

export const DeckCoreV1Keys: (keyof DeckCoreV1)[] = [
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

const objectType = "Deck";
export function assertDeckCoreV1(core: unknown): core is DeckCoreV1 {
	if (!assertSageCore<DeckCoreV1>(core, objectType, DeckCoreV1Keys)) return false;

	const isPositiveNumber = (value: number) => value > 0;
	const isValidCard = (value: unknown) => typeof(value) === "number" ? value >= 0 && value < core.cardCount : false;
	const isValidDeck = (value: string) => ["English52","English54"].includes(value);

	if (!assertNumber({ core, objectType, key:"cardCount", validator:isPositiveNumber })) return false;
	if (!assertArray({ core, objectType, key:"discardPile", validator:isValidCard, optional })) return false;
	if (!assertArray({ core, objectType, key:"drawPile", validator:isValidCard, optional })) return false;
	if (!assertArray({ core, objectType, key:"hand", validator:isValidCard, optional })) return false;
	if (!assertString({ core, objectType, key:"messageId", validator:isSnowflake, optional })) return false;
	if (!assertString({ core, objectType, key:"name", validator:isNotBlank, optional })) return false;
	if (!assertArray({ core, objectType, key:"spread", validator:isValidCard, optional })) return false;
	if (!assertString({ core, objectType, key:"type", validator:isValidDeck })) return false;

	return true;
}