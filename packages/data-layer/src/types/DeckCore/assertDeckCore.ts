import { isNotBlank, isSnowflake, sortPrimitive } from "@rsc-utils/core-utils";
import { assertArray, assertNumber, assertSageCore, assertString, optional } from "../../validation/index.js";
import { DeckCoreKeys, type DeckCore, type DeckCoreAny } from "./DeckCore.js";

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