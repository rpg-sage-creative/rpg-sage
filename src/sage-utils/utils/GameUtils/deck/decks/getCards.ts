import { getEnglish52Cards } from "./english52.js";
import { getEnglish54Cards } from "./english54.js";

export type CardBase = {
	/** Generally the index in a "new deck order" */
	id: number;
	name: string;
	code: string;
	emoji?: string;
};

export type DeckType = "English52" | "English54";

/**
 * face "up" represents a newly opened deck of cards with the faces up; this would put jokers on top at indexes 0, 1
 * face "down" represents a newly opened deck of cards with the faces down; this would put jokers on the bottom at indexes 50, 51
 */
export function getCards(deckType: DeckType, face: "up" | "down" = "up"): CardBase[] {
	let cards: CardBase[] = [];
	switch(deckType) {
		case "English52": cards = getEnglish52Cards(); break;
		case "English54": cards = getEnglish54Cards(); break;
		default: break;
	}
	if (face === "down") {
		cards.reverse();
	}
	return cards;
}