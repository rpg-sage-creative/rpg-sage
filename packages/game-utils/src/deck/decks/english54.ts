import type { CardBase } from "./getCards.js";

function getEnglish54Names(): string[] {
	return [
		"Joker 1",
		"Joker 2",
		"Ace of Spades",
		"2 of Spades",
		"3 of Spades",
		"4 of Spades",
		"5 of Spades",
		"6 of Spades",
		"7 of Spades",
		"8 of Spades",
		"9 of Spades",
		"10 of Spades",
		"Jack of Spades",
		"Queen of Spades",
		"King of Spades",
		"Ace of Diamonds",
		"2 of Diamonds",
		"3 of Diamonds",
		"4 of Diamonds",
		"5 of Diamonds",
		"6 of Diamonds",
		"7 of Diamonds",
		"8 of Diamonds",
		"9 of Diamonds",
		"10 of Diamonds",
		"Jack of Diamonds",
		"Queen of Diamonds",
		"King of Diamonds",
		"King of Clubs",
		"Queen of Clubs",
		"Jack of Clubs",
		"10 of Clubs",
		"9 of Clubs",
		"8 of Clubs",
		"7 of Clubs",
		"6 of Clubs",
		"5 of Clubs",
		"4 of Clubs",
		"3 of Clubs",
		"2 of Clubs",
		"Ace of Clubs",
		"King of Hearts",
		"Queen of Hearts",
		"Jack of Hearts",
		"10 of Hearts",
		"9 of Hearts",
		"8 of Hearts",
		"7 of Hearts",
		"6 of Hearts",
		"5 of Hearts",
		"4 of Hearts",
		"3 of Hearts",
		"2 of Hearts",
		"Ace of Hearts",
	];
}

function getEnglish54Code(card: string | number): string {
	const cardName = typeof(card) === "string" ? card : getEnglish54Names()[card]!;
	const [value, jokerNumber, suit] = cardName.split(" ") as [string, string, string];
	if (value === "Joker") return `j${jokerNumber}`;
	const suitLetter = suit[0]!.toLowerCase();
	if (+value) return `${value}${suitLetter}`;
	return `${value[0]!.toLowerCase()}${suitLetter}`;
}

function getEnglish54Emoji(card: string | number): string {
	const cardName = typeof(card) === "string" ? card : getEnglish54Names()[card]!;
	const [value, _of, suit] = cardName.split(" ") as [string, string, string];
	if (value === "Joker") return `:black_joker:`;
	const suitEmoji = `:${suit.toLowerCase()}:`;
	if (+value) return `${value}${suitEmoji}`;
	return `${value[0]}${suitEmoji}`;
}

let cards: CardBase[];

/** default order is face "up" */
export function getEnglish54Cards(): CardBase[] {
	cards ??= getEnglish54Names().map((name, id) => {
		const code = getEnglish54Code(name);
		const emoji = getEnglish54Emoji(name);
		return { id, name, code, emoji };
	});
	return cards;
}