import { capitalize, randomSnowflake, warn, type Optional, type Snowflake } from "@rsc-utils/core-utils";
import { randomItems, shuffle } from "@rsc-utils/dice-utils";
import { getCards, type CardBase, type DeckType } from "./decks/getCards.js";

/*
	A pile represents a stack of cards.
	A pile is a number array that contains the cardIds of the cards in the pile.
	Regardless of it being "face up" or "face down" we are going to treat index 0 as the top card.
	"unshift" represents placing a card on top of the pile.
	"shift" represents drawing a card from the top of pile.
	"push" represents placing a card on the bottom of the pile.
	"pop" represents taking a card from the bottom of the pile.

	Considerations:
	- use a negative cardId to represent the card is opposite face of the intended pile (ie. face up in a face down pile)
	- use decimal to represent "tapped" cards, .0 as normal orientation, .25 as 90 degrees, .50 as 180 degrees, and .75 as 270 (-90) degrees
*/

export type StackKey = "discardPile" | "drawPile" | "hand" | "spread";
export type StackWhereKey = "top" | "bottom";

export type DeckStack = { key:StackKey; name:Capitalize<StackKey>; cards:StackCard[]; count:number; };
export type StackCard = CardBase & { stackKey:StackKey; ordinal:number; label:string; };

export type DeckPlayArgs<From extends StackKey = StackKey, To extends StackKey = StackKey, FromWhere extends StackWhereKey = StackWhereKey, ToWhere extends StackWhereKey = StackWhereKey> =
	{ from:From; to:To; fromWhere:FromWhere; toWhere:ToWhere; indexes:number[]; cardIds?:never; randomCount?:never; count?:never; upTo?:never; }
	| { from:From; to:To; fromWhere:FromWhere; toWhere:ToWhere; indexes?:never; cardIds:number[]; randomCount?:never; count?:never; upTo?:never; }
	| { from:From; to:To; fromWhere:FromWhere; toWhere:ToWhere; indexes?:never; cardIds?:never; randomCount:number; count?:never; upTo?:never; }
	| { from:From; to:To; fromWhere:FromWhere; toWhere:ToWhere; indexes?:never; cardIds?:never; randomCount?:never; count?:number; upTo?:never; }
	| { from:From; to:To; fromWhere:FromWhere; toWhere:ToWhere; indexes?:never; cardIds?:never; randomCount?:never; count?:never; upTo?:number; };

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

/** becuase we use ordinals to select cards in hand/spread we need to reverse their slice args @todo decide if this is the right choice or not */
function getSliceArgs(count: number, where: StackWhereKey) {
	return where === "top" ? { start:0, end:count } : { start:-1 * count, end:undefined };
}

export class Deck {
	public constructor(protected core: DeckCore) { }

	public get cardCount() { return this.core.cardCount; }

	public get discardPile() { return this.core.discardPile ?? (this.core.discardPile = []); }
	public get discardPileCount(): number { return this.discardPile.length; }

	public get drawPile() { return this.core.drawPile ?? (this.core.drawPile = []); }
	public get drawPileCount(): number { return this.drawPile.length; }

	public get hand() { return this.core.hand ?? (this.core.hand = []); }
	public get handCards() { return this.getStack("hand").cards; }
	public get handCardsCount(): number { return this.hand.length; }

	public get id() { return this.core.id; }

	public get isClean() { return this.drawPile.length === this.cardCount && this.drawPile.every(((value, index) => value === index)); }

	public get messageId() { return this.core.messageId; }
	public set messageId(messageId: Snowflake | undefined) { this.core.messageId = messageId; }

	public get spread() { return this.core.spread ?? (this.core.spread = []); }
	public get spreadCards() { return this.getStack("spread").cards; }
	public get spreadCardsCount(): number { return this.spread.length; }

	public audit() {
		const cards = getCards(this.core.type);
		// no cards is bad ... incorrect deck size is bad
		if (!cards.length || this.core.cardCount !== cards.length) return false;

		// compare card ids to ensure a proper deck
		const cleanDeck = cards.map(({ id }) => id);
		const thisDeck = [...this.discardPile, ...this.drawPile, ...this.hand, ...this.spread].sort();
		return thisDeck.join(",") !== cleanDeck.join(",");
	}

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

		}else if ("randomCount" in args) {
			const randomCount = args.randomCount ?? 0;
			return randomCount > 0 && fromStack.length >= randomCount;

		}else if ("upTo" in args) {
			const upTo = args.upTo ?? 0;
			return upTo > 0 && fromStack.length >= 0;

		}else if ("count" in args) {
			const count = args.count ?? 0;
			return count > 0 && fromStack.length >= count;

		}else {
			throw new RangeError("Invalid DeckPlayArgs");
		}
	}

	/** Gets a card's info based on card name, code, or id. */
	public findCard(cardValue: string | number): StackCard;
	public findCard(cardValue: string | number, stackKey: StackKey): StackCard | undefined;
	public findCard(cardValue: string | number, stackKey?: StackKey): StackCard | undefined {
		const cardBase = Deck.findCard(this.core.type, cardValue);
		if (!cardBase) return undefined;

		const findInStack = (key: StackKey) => {
			const stack = this[key];
			const stackIndex = stack.indexOf(cardBase.id);
			if (stackIndex > -1) {
				return { stackKey:key, ordinal:stackIndex+1, label:cardBase.emoji ?? cardBase.code.toUpperCase(), ...cardBase };
			}
			return undefined;
		};

		if (stackKey) return findInStack(stackKey);

		const stackKeys = ["discardPile", "drawPile", "hand", "spread"] as StackKey[];
		for (const key of stackKeys) {
			const stackCard = findInStack(key);
			if (stackCard) return stackCard;
		}

		return undefined;
	}

	public getStack(key: StackKey): DeckStack {
		const { type } = this.core;
		const cardIds = this[key];
		const cards = cardIds.map((cardId, index) => {
			const card = Deck.findCard(type, cardId)!;
			return { stackKey:key, ordinal:index+1, label:card.emoji??card.code, ...card };
		});
		const count = cards.length;
		return { key, name:capitalize(key), cards, count };
	}

	/** @returns played cards */
	public play<From extends StackKey = StackKey, To extends StackKey = StackKey>(args: DeckPlayArgs<From, To>) {
		const { fromWhere = "top", toWhere = "top" } = args;

		if (!this.canPlay(args)) {
			return {
				fromStack: this.getStack(args.from),
				toStack: this.getStack(args.to),
				played:[] as CardBase[],
				fromWhere,
				toWhere
			};
		}

		const fromCards = this[args.from];
		const toCards = this[args.to];

		const cardIds: number[] = [];
		if (args.cardIds) {
			cardIds.push(...args.cardIds);

		}else if (args.indexes) {
			cardIds.push(...args.indexes.map(index => fromCards[index]));

		} else if (args.randomCount) {
			cardIds.push(...randomItems(fromCards, args.randomCount));

		}else if (args.upTo) {
			const countToPlay = args.upTo - toCards.length;
			if (countToPlay > 0) {
				const { start, end } = getSliceArgs(countToPlay, fromWhere);
				cardIds.push(...fromCards.slice(start, end));
			}

		}else if (args.count) {
			if (args.count > 0) {
				const { start, end } = getSliceArgs(args.count, fromWhere);
				cardIds.push(...fromCards.slice(start, end));
			}

		}
		if (!cardIds.length) throw new RangeError(`Invalid DeckPlayArgs`);

		const fn = toWhere === "top" ? "unshift" : "push";

		const played = cardIds.map(cardId => {
			// remove from
			fromCards.splice(fromCards.indexOf(cardId), 1);

			// add to; push reprents the top; unshift represents the bottom
			toCards[fn](cardId);

			return this.findCard(cardId)!;
		});

		return {
			fromStack: this.getStack(args.from),
			toStack: this.getStack(args.to),
			played,
			fromWhere,
			toWhere
		};
	}

	public reset() {
		/** @todo this type check is only temp while i develop */
		const type = this.core.type?.replace("Default", "English") as DeckType ?? "Default52";

		const { id, objectType } = this.core;
		const drawPile = getCards(type).map(({id}) => id);
		this.core = {
			cardCount: drawPile.length,
			drawPile,
			id,
			name: type,
			objectType,
			type
		};
	}

	public shuffle(from: StackKey, to?: StackKey) {
		const { core } = this;
		if (to) {
			core[to] = shuffle((core[from] ?? []).concat(core[to] ?? []));
			core[from] = [];

		}else {
			core[from] = shuffle(core[from] ?? []);
		}
		return { fromStack:this.getStack(from), toStack:to?this.getStack(to):undefined };
	}

	public toJSON() { return this.core; }

	/** Gets a card's info based on deckType and card name or id (index in "new deck order"). */
	public static findCard(deckType: DeckType, card: string | number): CardBase | undefined {
		return getCards(deckType).find(c => c.id === card || c.name === card || c.code === card);
	}

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

	public static parseStackKey(value?: Optional<string>): StackKey | undefined {
		if (value) {
			if (/^discard(Pile)?$/i.test(value)) return "discardPile";
			if (/^draw(Pile)?$/i.test(value)) return "drawPile";
			if (/^hand$/i.test(value)) return "hand";
			if (/^spread$/i.test(value)) return "spread";
		}
		return undefined;
	}

	public static parseStackWhereKey(value?: Optional<string>): StackWhereKey | undefined {
		return value === "top" ? "top" : value === "bottom" ? "bottom" : undefined;
	}

	public static from(core: DeckCore | Deck): Deck {
		if ("toJSON" in core) {
			warn(`Deck.from(Deck): should have been a DeckCore!`);
			core = core.toJSON();
		}

		const deck = new Deck(core);
		if (!deck.audit()) {
			warn(`Resetting Invalid Deck!`);
			deck.reset();
		}

		return deck;
	}
}
