import { randomSnowflake, type Snowflake } from "@rsc-utils/core-utils";
import { randomItems } from "../random/randomItems.js";
import { shuffle } from "../random/shuffle.js";
import { getCards, type CardBase, type DeckType } from "./decks/getCards.js";

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

type StackKey = "discardPile" | "drawPile" | "hand" | "spread";

export type StackCard = CardBase & { ordinal:number; };

export type DeckPlayArgs<From extends StackKey = StackKey, To extends StackKey = StackKey> =
	{ from:From; to:To; indexes:number[]; cardIds?:never; randomCount?:never; count?:never; upTo?:never; }
	| { from:From; to:To; indexes?:never; cardIds:number[]; randomCount?:never; count?:never; upTo?:never; }
	| { from:From; to:To; indexes?:never; cardIds?:never; randomCount:number; count?:never; upTo?:never; }
	| { from:From; to:To; indexes?:never; cardIds?:never; randomCount?:never; count?:number; upTo?:never; }
	| { from:From; to:To; indexes?:never; cardIds?:never; randomCount?:never; count?:never; upTo?:number; };

export type DeckDrawArgs = { count:number; upTo?:never; } | { count?:never; upTo:number; };

export type DeckCore = {
	cardCount: number;

	/** Represents cards that were discarded. */
	discardPile?: number[];

	/** Represents face down cards to be drawn from. Stored by cardId. Top of the deck (first drawn) is index 0. */
	drawPile?: number[];

	/** Represents the cards held in hand. */
	hand?: number[];

	id: Snowflake;

	messageId?: Snowflake;

	name: string;

	/** Sage Core objectType. */
	objectType: "Deck";

	spread?: number[];

	/** Default deck is a 52 card deck */
	type: DeckType;
};

function updateCore(core: DeckCore): DeckCore {
	if ((core.type as "Default52") === "Default52") core.type = "English52";
	if ((core.type as "Default54") === "Default54") core.type = "English54";
	if (!core.cardCount) core.cardCount = getCards(core.type).length;
	return core;
}

export class Deck {
	public constructor(protected core: DeckCore) { updateCore(core); }

	public get cardCount() { return this.core.cardCount; }

	public get discardPile() { return this.core.discardPile ?? (this.core.discardPile = []); }
	public get discardPileCount(): number { return this.discardPile.length; }

	public get drawPile() { return this.core.drawPile ?? (this.core.drawPile = []); }
	public get drawPileCount(): number { return this.drawPile.length; }

	public get hand() { return this.core.hand ?? (this.core.hand = []); }
	public get handCards(): CardBase[] { return this.hand.map(cardId => this.findCard(cardId)!); }
	public get handCardsCount(): number { return this.hand.length; }

	public get id() { return this.core.id; }

	public get messageId() { return this.core.messageId; }
	public set messageId(messageId: Snowflake | undefined) { this.core.messageId = messageId; }

	public get spread() { return this.core.spread ?? (this.core.spread = []); }
	public get spreadCards(): CardBase[] { return this.spread.map(cardId => this.findCard(cardId)!); }
	public get spreadCardsCount(): number { return this.spread.length; }

	public canPlay<From extends StackKey = StackKey, To extends StackKey = StackKey>(args: DeckPlayArgs<From, To>) {
		const fromStack = this[args.from];
		const toStack = this[args.to];

		if (!fromStack || !toStack || fromStack === toStack) {
			throw new RangeError("Invalid DeckPlayArgs");
		}

		if (args.cardIds) {
			return args.cardIds.every(cardId => fromStack.includes(cardId)) ?? false;

		}else if (args.indexes) {
			return args.indexes.every(index => index >= 0 && index < fromStack.length) ?? false;

		}else if ("count" in args) {
			const count = args.count ?? 0;
			return count > 0 && fromStack.length >= count;

		}else if ("upTo" in args) {
			const upTo = args.upTo ?? 0;
			return upTo > 0 && fromStack.length >= 0;

		}else if ("randomCount" in args) {
			const randomCount = args.randomCount ?? 0;
			return randomCount > 0 && fromStack.length >= randomCount;

		}else {
			throw new RangeError("Invalid DeckPlayArgs");
		}
	}

	/** @returns played cards */
	public play<From extends StackKey = StackKey, To extends StackKey = StackKey>(args: DeckPlayArgs<From, To>) {
		if (!this.canPlay(args)) return [];

		const fromStack = this[args.from];
		const toStack = this[args.to];

		const cardIds = args.cardIds ?? [];
		if (args.randomCount) {
			cardIds.push(...randomItems(fromStack, args.randomCount));
		}
		if (args.indexes) {
			cardIds.push(...args.indexes.map(index => fromStack[index]));
		}
		if (args.count || args.upTo) {
			let countToPlay = 0;

			const { count = 0, upTo = 0 } = args ?? {};

			if (count > 0) {
				countToPlay = count;
			}

			if (upTo > toStack.length) {
				countToPlay = upTo - toStack.length;
			}

			cardIds.push(...fromStack.slice(0, countToPlay));
		}
		if (!cardIds.length) throw new RangeError(`Invalid DeckPlayArgs`);

		return cardIds.map(cardId => {
			// remove from
			fromStack.splice(fromStack.indexOf(cardId), 1);

			// add to
			toStack.push(cardId);

			return this.findCard(cardId)!;
		});
	}

	public shuffle(which: StackKey, into?: StackKey) {
		const { core } = this;
		if (into) {
			core[into] = shuffle((core[which] ?? []).concat(core[into] ?? []));
			core[which] = [];

		}else {
			core[which] = shuffle(core[which] ?? []);
		}
	}

	public toJSON() { return this.core; }

	//#region findCard

	/** Gets a card's info based on card name or id (index in "new deck order"). */
	public findCard(card: string | number): CardBase;
	public findCard(card: string | number, stack: StackKey): StackCard | undefined;
	public findCard(cardValue: string | number, stackKey?: StackKey) {
		const cardBase = Deck.findCard(this.core.type, cardValue);
		if (stackKey) {
			if (cardBase) {
				const stack = this[stackKey];
				const stackIndex = stack.indexOf(cardBase.id);
				if (stackIndex > -1) {
					return { ...cardBase, ordinal:stackIndex+1 };
				}
			}
			return undefined;
		}
		return cardBase!;
	}

	/** Gets a card's info based on deckType and card name or id (index in "new deck order"). */
	public static findCard(deckType: DeckType, card: string | number): CardBase | undefined {
		return getCards(deckType).find(c => c.id === card || c.name === card || c.code === card);
	}

	//#endregion

	public static createDeck(type: DeckType = "English52") {
		const cards = getCards(type);
		const drawPile = cards.map(({id}) => id);
		const core: DeckCore = {
			cardCount: cards.length,
			drawPile,
			id: randomSnowflake(),
			name: type,
			objectType: "Deck",
			type
		};
		return new Deck(core);
	}

}
