import type { CardBase } from "./getCards.js";

function getEnglish52Names(): string[] {
	return [
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

function getEnglish52Code(card: string | number): string {
	const cardName = typeof(card) === "string" ? card : getEnglish52Names()[card]!;
	const [value, _of, suit] = cardName.split(" ") as [string, string, string];
	const suitLetter = suit[0]!.toLowerCase();
	const number = +value;
	if (number) return `${number}${suitLetter}`;
	return `${value[0]!.toLowerCase()}${suitLetter}`;
}

function getEnglish52Emoji(card: string | number): string {
	const cardName = typeof(card) === "string" ? card : getEnglish52Names()[card]!;
	const [value, _of, suit] = cardName.split(" ") as [string, string, string];
	const suitEmoji = `:${suit.toLowerCase()}:`;
	const number = +value;
	if (number) return `${number}${suitEmoji}`;
	return `${value[0]}${suitEmoji}`;
}

let cards: CardBase[];

/** default order is face "up" */
export function getEnglish52Cards(): CardBase[] {
	cards ??= getEnglish52Names().map((name, id) => {
		const code = getEnglish52Code(name);
		const emoji = getEnglish52Emoji(name);
		return { id, name, code, emoji };
	});
	return cards;
}