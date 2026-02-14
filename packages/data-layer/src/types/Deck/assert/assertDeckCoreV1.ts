import { isNotBlank, isSnowflake, sortPrimitive } from "@rsc-utils/core-utils";
import { assertArray, assertNumber, assertSageCore, assertString, optional } from "../../../validation/index.js";
import { DeckCoreV1Keys, type DeckCoreAny, type DeckCoreV1 } from "../index.js";

export function assertEnglishDeck(core: DeckCoreV1, count: number): boolean {
	const cards = ([] as number[])
		.concat(core.discardPile ?? [])
		.concat(core.drawPile ?? [])
		.concat(core.hand ?? [])
		.concat(core.spread ?? [])
		;
	cards.sort(sortPrimitive);
	return cards.length === count && cards.every((value, index) => value === index);
}

const objectType = "Deck";
export function assertDeckCoreV1(core: DeckCoreAny): core is DeckCoreV1 {
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
	if (core.type === "English52" && !assertEnglishDeck(core, 52)) return false;
	if (core.type === "English54" && !assertEnglishDeck(core, 54)) return false;

	return true;
}