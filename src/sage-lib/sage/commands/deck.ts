import { type Optional } from "@rsc-utils/core-utils";
import type { Deck } from "../../../sage-utils/utils/GameUtils/Deck.js";
import { registerListeners } from "../../discord/handlers/registerListeners.js";
import type { SageCommand } from "../model/SageCommand.js";

type WhichCards = "drawPile" | "discardPile" | "hand";
function getWhich(value: Optional<string>): WhichCards | undefined {
	if (value) {
		if (/discardPile/i.test(value)) return "discardPile";
		if (/drawPile/i.test(value)) return "drawPile";
		if (/hand/i.test(value)) return "hand";
	}
	return undefined;
}

async function charDeckShuffle(sageCommand: SageCommand): Promise<void> {
	const { replyStack } = sageCommand;

	const charName = sageCommand.args.getString("char");
	const char = charName ? sageCommand.findCharacter(charName) : sageCommand.playerCharacter;
	if (!char) {
		await replyStack.reply(`Character Not Found!\nExample Usage:\n> sage! deck shuffle char="Gambit" which="drawPile"`);
		return;
	}

	const _which = sageCommand.args.getString("which");
	let which = getWhich(_which);
	const _into = sageCommand.args.getString("into");
	const into = getWhich(_into)

	if ((_which && !which) || (_into && !into)) {
		if (_into) {
			await replyStack.reply(`Invalid Shuffle Args!\nExample Usage:\n> sage! deck shuffle char="Gambit" which="discardPile" into="drawPile"`);
		}else {
			await replyStack.reply(`Invalid Shuffle Args!\nExample Usage:\n> sage! deck shuffle char="Gambit" which="drawPile"`);
		}
		return;
	}

	which ??= "drawPile";

	const deck = char.getOrCreateDeck();
	deck.shuffle(which, into);

	const saved = await char.save();
	if (!saved) {
		await replyStack.reply(`Sorry, something went wrong trying to shuffle!`);
		return;
	}

	const action = into ? `Shuffled ${which} into ${into}.` : `Shuffled ${which}.`;
	const output = getStatus(char.toDisplayName(), action, deck);
	await replyStack.reply(output.join("\n"));
}

function getStatus(charName: string, action: string, deck: Deck): string[] {
	return [
		`## ${charName}`,
		action ? `> **Action:** ${action}` : undefined,
		`### Deck Status`,
		`> **DrawPile:** ${deck.drawPileCount}`,
		`> **DiscardPile:** ${deck.discardPileCount}`,
		`> **Hand:** ${deck.handCards.map(c => c.emoji).join(", ") || "*empty*"}`
	].filter(s => s) as string[];
}

async function charDeckDraw(sageCommand: SageCommand): Promise<void> {
	const { replyStack } = sageCommand;

	const charName = sageCommand.args.getString("char");
	const char = charName ? sageCommand.findCharacter(charName) : sageCommand.playerCharacter;
	if (!char) {
		await replyStack.reply(`Character Not Found!\nExample Usage:\n> sage! deck draw char="Gambit" which="drawPile"`);
		return;
	}

	const count = sageCommand.args.getNumber("count") ?? 1;
	const upTo = sageCommand.args.getNumber("upTo");
	const drawArgs = upTo ? { upTo } : { count };

	const deck = char.getOrCreateDeck();
	if (!deck.canDrawToHand(drawArgs)) {
		await replyStack.reply(`Cannot draw: DrawPile (${deck.drawPileCount}), Hand (${deck.handCardsCount})`);
		return;
	}

	const drawn = deck.drawToHand(drawArgs);

	const saved = await char.save();
	if (!saved) {
		await replyStack.reply(`Sorry, something went wrong trying to draw!`);
		return;
	}

	const s = drawn.length > 1 ? "s" : "";
	const action = `Drew ${drawn.length} card${s} into their hand.`;
	const output = getStatus(char.toDisplayName(), action, deck);
	await replyStack.reply(output.join("\n"));
}

async function charDeckDiscard(sageCommand: SageCommand): Promise<void> {
	const { replyStack } = sageCommand;

	const charName = sageCommand.args.getString("char");
	const char = charName ? sageCommand.findCharacter(charName) : sageCommand.playerCharacter;
	if (!char) {
		await replyStack.reply(`Character Not Found!\nExample Usage:\n> sage! deck discard char="Gambit" which="drawPile"`);
		return;
	}

	const cardNo = sageCommand.args.getNumber("card")
	const cardNos = sageCommand.args.getString("cards")?.split(",").map(no => +no) ?? [];
	const cardIndexes = cardNo ? [cardNo - 1] : cardNos.map(no => no - 1);
	if (!cardIndexes.length) {
		await replyStack.reply(`Invalid Discard Args!\nExample Usage:\n> sage! deck discard card=1\nor\n> sage! deck discard cards="1,2"`);
		return;
	}

	const deck = char.getOrCreateDeck();

	const { handCards } = deck;
	const cardIds = cardIndexes.map(index => handCards[index].id);
	const discardArgs = { cardIds };

	if (!deck.canDiscardFromHand(discardArgs)) {
		await replyStack.reply(`Cannot discard: Hand (${deck.handCardsCount}), Cards (${cardIndexes})`);
		return;
	}

	const discarded = deck.discardFromHand(discardArgs);

	const saved = await char.save();
	if (!saved) {
		await replyStack.reply(`Sorry, something went wrong trying to discard!`);
		return;
	}

	const s = discarded.length > 1 ? "s" : "";
	const action = `Discarded ${discarded.length} card${s} from their hand.`;
	const output = getStatus(char.toDisplayName(), action, deck);
	await replyStack.reply(output.join("\n"));
}

export async function charDeckShow(sageCommand: SageCommand): Promise<void> {
	const { replyStack } = sageCommand;

	const charName = sageCommand.args.getString("char");
	const char = charName ? sageCommand.findCharacter(charName) : sageCommand.playerCharacter;
	if (!char) {
		await replyStack.reply(`Character Not Found!\nExample Usage:\n> sage! deck show char="Gambit" which="drawPile"`);
		return;
	}

	const deck = char.getOrCreateDeck();

	const output = getStatus(char.toDisplayName(), "", deck);
	await replyStack.reply(output.join("\n"));}

export function registerDeckCommands() {
	registerListeners({ commands:[/(deck\s*shuffle)/i], message:charDeckShuffle });
	registerListeners({ commands:[/(deck\s*draw)/i], message:charDeckDraw });
	registerListeners({ commands:[/(deck\s*discard)/i], message:charDeckDiscard });
	registerListeners({ commands:[/(deck\s*show)/i], message:charDeckShow });
}