
/*
	A pile represents a stack of cards.
	A pile is a number array that contains the cardIds of the cards in the pile.
	Regardless of it being "face up" or "face down" we are going to push/pop from the top of the pile.
	"push" represents placing a card on the pile.
	"pop" represents drawing a card from the pile.

	Considerations:
	- use a negative cardId to represent the card is opposite face of the intended pile (ie. face up in a face down pile)
	- use decimal to represent "tapped" cards, .0 as normal orientation, .25 as 90 degrees, .50 as 180 degrees, and .75 as 270 (-90) degrees
*/

import { randomSnowflake, type Snowflake } from "@rsc-utils/core-utils";
import { randomItems, shuffle } from "@rsc-utils/dice-utils";

type TCard = {
	/** Generally the index in a new deck order */
	id: number;
	name: string;
	emoji?: string;
};

type DeckType = "Default52" | "Default54";

export type DeckCore = {
	/** The id of the active card that was just drawn but not yet used. */
	drawn: number[];

	/** Represents cards that were discarded. */
	discardPile: number[];

	/** Represents face down cards to be drawn from. Stored by cardId. Top of the deck (first drawn) is index 0. */
	drawPile: number[];

	/** Represents the cards held in hand. */
	hand: number[];

	id: Snowflake;

	name: string;

	/** Sage Core objectType. */
	objectType: "Deck";

	/** Default deck is a 52 card deck */
	type: DeckType;
};

export class Deck {
	public constructor(protected core: DeckCore) { }

	/** count of cards discarded */
	public get discardPileCount() { return this.core.discardPile.length; }

	/** cards drawn but not used */
	public get drawnCards() { return this.core.drawn.map(cardId => this.cardFromId(cardId)); }
	public get drawnCardsCount() { return this.core.drawn.length; }

	/** count of cards that be drawn */
	public get drawPileCount() { return this.core.drawPile.length; }

	public get handCards() { return this.core.hand.map(cardId => this.cardFromId(cardId)); }
	public get handCardsCount() { return this.core.hand.length; }

	public canDraw(count = 1) {
		if (count < 0) return this.core.drawn.length >= Math.abs(count);
		if (count > 0) return this.core.drawPile.length >= count;
		return false;
	}

	/**
	 * @returns drawn cards
	 */
	public draw(count = 1) {
		if (!this.canDraw(count)) return this.drawnCards;

		const { drawn, drawPile } = this.core;

		// undraw (replace to the top of the deck)
		if (count < 0) {
			while (count < 0 && drawn.length) {
				drawPile.push(drawn.pop()!);
				count++;
			}

		// draw (pull from the top of the deck)
		}else if (count > 0) {
			while (count > 0 && drawPile.length) {
				drawn.push(drawPile.pop()!);
				count--;
			}

		}

		return this.drawnCards;
	}

	public canDrawToHand(args: DrawArgs = { count:1 }) {
		// we still have cards drawn from another action ... can't draw
		if (this.core.drawn.length) return false;

		const countToDraw = getCountToDraw(this.core.hand.length, args);

		return countToDraw > 0 && countToDraw <= this.core.drawPile.length;

	}

	/**
	 * @returns cards drawn
	 */
	public drawToHand(args: DrawArgs = { count:1 }) {
		const { drawn, hand } = this.core;

		// we still have cards drawn from another action ... do nothing
		if (drawn.length) return [];

		const countToDraw = getCountToDraw(hand.length, args);

		// nothing to do
		if (!countToDraw) return [];

		// draw but ignore TCards
		const drawnCards = this.draw(countToDraw);

		// work with ids
		while (drawn.length) {
			hand.push(drawn.pop()!);
		}

		return drawnCards;
	}

	public canDiscardFromHand(args: DiscardArgs = { randomCount:1 }) {
		const { hand } = this.core;
		if (args.cardIds) {
			return args.cardIds.every(cardId => hand.includes(cardId));

		}else if (args.randomCount) {
			return args.randomCount > 0 && hand.length >= args.randomCount;

		}else if (args.indexes) {
			return args.indexes.every(index => index >= 0 && index < hand.length) ?? false;
		}
		return false;
	}

	/**
	 * @returns discarded card
	 */
	public discardFromHand(args: DiscardArgs = { randomCount:1 }) {
		if (!this.canDiscardFromHand(args)) return [];

		const { discardPile, hand } = this.core;

		const cardIds = args.cardIds ?? [];
		if (args.randomCount) {
			cardIds.push(...randomItems(hand, args.randomCount));
		}
		if (args.indexes) {
			cardIds.push(...args.indexes.map(index => hand[index]));
		}
		if (!cardIds.length) throw new RangeError(`Invalid DiscardArgs`);

		return cardIds.map(cardId => {
			// remove from hand
			hand.splice(hand.indexOf(cardId), 1);

			// add to discard
			discardPile.push(cardId);

			return this.cardFromId(cardId);
		});
	}

	public shuffle(which: ShuffleKey, into?: ShuffleKey) {
		const { core } = this;
		if (into) {
			core[into] = shuffle(core[which].concat(core[into]));
			core[which].length = 0;

		}else {
			core[which] = shuffle(core[which]);
		}
	}

	public toJSON() { return this.core; }

	//#region cardFromId

	/** Gets a card's info based on cardId. */
	public cardFromId(cardId: number): TCard { return Deck.cardFromId(this.core.type, cardId); }

	/** Gets a card's info based on deckType and cardId. This lets the deck core store only cardIds (numbers). */
	public static cardFromId(deckType: DeckType, cardId: number): TCard {
		const cardNames = getCardNames(deckType);
		const name = cardNames[cardId];
		const emoji = getDefaultDeckEmoji(name);
		return { id:cardId, name, emoji };
	}

	public static createDeck(type: DeckType = "Default52") {
		const cardNames = getCardNames(type);
		const drawPile = cardNames.map((_name, index) => index);
		const core: DeckCore = {
			drawn: [],
			discardPile: [],
			drawPile,
			hand: [],
			id: randomSnowflake(),
			name: type,
			objectType: "Deck",
			type
		};
		return new Deck(core);
	}

	//#endregion
}

type ShuffleKey = "discardPile" | "drawn" | "drawPile" | "hand";

type DiscardArgs = { indexes:number[]; cardIds?:never; randomCount?:never; } | { indexes?:never; cardIds:number[]; randomCount?:never; } | { indexes?:never; cardIds?:never; randomCount:number; };

type DrawArgs = { count:number; upTo?:never; } | { count?:never; upTo:number; };
function getCountToDraw(initialCount: number, args: DrawArgs) {
	let countToDraw = 0;

	const { count = 0, upTo = 0 } = args ?? {};

	if (count > 0) {
		countToDraw = count;
	}

	if (upTo > initialCount) {
		countToDraw = upTo - initialCount;
	}

	return countToDraw;
}

function getDefaultDeckEmoji(cardName: string): string {
	if (cardName.startsWith("Joker")) return ":black_joker:";
	const [value, _of, suit] = cardName.split(" ");
	const suitEmoji = `:${suit.toLowerCase()}:`;
	const number = +value;
	if (number) return `${number}${suitEmoji}`;
	return `${value[0]}${suitEmoji}`;
}

function getDefaultDeckCardNames(count: 52 | 54, face: "up" | "down"): string[] {
	const cardNames = `
	Joker 1
	Joker 2
	Ace of Spades
	2 of Spades
	3 of Spades
	4 of Spades
	5 of Spades
	6 of Spades
	7 of Spades
	8 of Spades
	9 of Spades
	10 of Spades
	Jack of Spades
	Queen of Spades
	King of Spades
	Ace of Diamonds
	2 of Diamonds
	3 of Diamonds
	4 of Diamonds
	5 of Diamonds
	6 of Diamonds
	7 of Diamonds
	8 of Diamonds
	9 of Diamonds
	10 of Diamonds
	Jack of Diamonds
	Queen of Diamonds
	King of Diamonds
	King of Clubs
	Queen of Clubs
	Jack of Clubs
	10 of Clubs
	9 of Clubs
	8 of Clubs
	7 of Clubs
	6 of Clubs
	5 of Clubs
	4 of Clubs
	3 of Clubs
	2 of Clubs
	Ace of Clubs
	King of Hearts
	Queen of Hearts
	Jack of Hearts
	10 of Hearts
	9 of Hearts
	8 of Hearts
	7 of Hearts
	6 of Hearts
	5 of Hearts
	4 of Hearts
	3 of Hearts
	2 of Hearts
	Ace of Hearts
	`.split("\n").map(s => s.trim()).filter(s => s);
	// Ad card 1
	// Ad card 2
	if (count === 52) {
		cardNames.splice(0, 2);
	}
	if (face === "down") {
		cardNames.reverse();
	}
	return cardNames;
}

function getCardNames(deckType: DeckType): string[] {
	switch(deckType) {
		case "Default52": return getDefaultDeckCardNames(52, "down");
		case "Default54": return getDefaultDeckCardNames(54, "down");
		default: return [];
	}
}
