import { BULLET, capitalize, error, type Snowflake } from "@rsc-utils/core-utils";
import { toUserMention } from "@rsc-utils/discord-utils";
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle } from "discord.js";
import { Deck, type CardBase, type DeckPlayArgs, type StackCard, type StackKey, type StackWhereKey } from "../../../sage-utils/utils/GameUtils/deck/index.js";
import { deleteMessage } from "../../discord/deletedMessages.js";
import { registerListeners } from "../../discord/handlers/registerListeners.js";
import type { CharacterManager } from "../model/CharacterManager.js";
import type { GameCharacter } from "../model/GameCharacter.js";
import { SageCommand } from "../model/SageCommand.js";
import type { SageCommandArgs } from "../model/SageCommandArgs.js";
import type { SageInteraction } from "../model/SageInteraction.js";
import type { SageMessage } from "../model/SageMessage.js";
import { createMessageDeleteButton } from "../model/utils/deleteButton.js";
import { toTrackerBar } from "../model/utils/ValueBars.js";

function getStringArg({ args }: SageCommand, ...keys: string[]): string | undefined {
	for (const key of keys) {
		const value = args.getString(key);
		if (value) return value;
	}
	return undefined;
}

function findCharByDeck(chars: CharacterManager, deckId: string): GameCharacter | undefined {
	for (const char of chars) {
		if (char.hasDeck(deckId)) return char;
		const descendant = findCharByDeck(char.companions, deckId);
		if (descendant) return descendant;
	}
	return undefined;
}
function findCharsWithDecks(chars: CharacterManager): GameCharacter[] {
	const withDecks: GameCharacter[] = [];
	for (const char of chars) {
		if (char.hasDecks) withDecks.push(char);
		withDecks.push(...findCharsWithDecks(char.companions));
	}
	return withDecks;
}

function findChar(sageCommand: SageCommand, { charId, deckId }: { charId?:string; deckId?:string; } = {}): GameCharacter | undefined {
	const idOrName = charId ?? getStringArg(sageCommand, "char", "name");
	if (idOrName) {
		return sageCommand.findCharacter(idOrName);
	}

	if (deckId) {
		const { game } = sageCommand;
		if (game) {
			if (game.gmCharacter.hasDeck(deckId)) return game.gmCharacter;
			const gameChar = findCharByDeck(game.playerCharacters, deckId) ?? findCharByDeck(game.nonPlayerCharacters, deckId);
			if (gameChar) return gameChar;
		}
		const user = sageCommand.sageUser;
		return findCharByDeck(user.playerCharacters, deckId) ?? findCharByDeck(user.nonPlayerCharacters, deckId);
	}

	if (sageCommand.isGameMaster) {
		return sageCommand.gmCharacter;
	}

	return sageCommand.playerCharacter;
}

type RenderArgs = { actionText?:string; actorId?:Snowflake; char:GameCharacter; deck?:never; includeState?:never; showHand?:boolean; showSpread?:boolean; }
	| { actionText?:string; actorId?:Snowflake; char:GameCharacter; deck:Deck; includeState:true; showHand?:boolean; showSpread?:boolean; };
function renderAction({ actionText, actorId, char, deck, includeState, showHand, showSpread }: RenderArgs): string {
	const lines = [];
	if (actorId) {
		const mention = toUserMention(actorId);
		if (mention) lines.push(`**${char.toDisplayName()}** (${mention})`);
	}
	if (!lines.length) {
		lines.push(`**${char.toDisplayName()}**`);
	}
	if (actionText) {
		lines.push(`> **Action:** ${actionText}`);
	}
	if (includeState) {
		const auditMode = char.getStat("deckMode") === "audit";
		lines.push(renderState("Deck State", deck, { showHand, showSpread, auditMode }));
	}
	return lines.join("\n");
}

function xCards(cards: number | ArrayLike<any>): string {
	const count = typeof(cards) === "number" ? cards : cards.length;
	const s = count > 1 ? "s" : "";
	return `${count} card${s}`;
}

function renderState(label: string, deck: Deck, opts?: { showHand?:boolean; showSpread?:boolean; auditMode?:boolean; }): string {
	const visualize = (count: number) => toTrackerBar(Math.max(count, Math.ceil(0.125 * deck.cardCount)), deck.cardCount).slice(1);
	const drawGauge = deck.drawPileCount ? visualize(deck.drawPileCount) : "";
	const discardGauge = deck.discardPileCount ? visualize(deck.discardPileCount) : "";
	const unshuffled = deck.isClean ? `***UNSHUFFLED***` : ``;
	const lines = [
		`### ${label}`,
	];
	if (opts?.auditMode) {
		const getEmoji = (stackKey: StackKey) => {
			const stack = deck.getStack(stackKey);
			const left: string[] = [];
			const right: string[] = [];
			if (stack.count) left.push(stack.cards[0].label);
			if (stack.count > 2) left.push(stack.cards[1].label);
			if (stack.count > 3) right.push(stack.cards[stack.count - 2].label);
			if (stack.count > 1) right.push(stack.cards[stack.count - 1].label);
			return left.length && right.length
				? `${left.join(` ${BULLET} `)} ... (${stack.count - left.length - right.length}) ... ${right.join(` ${BULLET} `)}`
				: left.length ? `${left[0]}` : "*empty*";
		};
		lines.push(
			`> **DrawPile:** ${getEmoji("drawPile")} ${unshuffled}`,
			`> **DiscardPile:** ${getEmoji("discardPile")}`,
		);
	}else {
		lines.push(
			`> **DrawPile:** ${deck.drawPileCount || "*empty*"} ${drawGauge} ${unshuffled}`,
			`> **DiscardPile:** ${deck.discardPileCount || "*empty*"} ${discardGauge}`,
		);
	}
	if (opts?.showSpread || opts?.auditMode) {
		lines.push(`> **Spread:** ${deck.spreadCards.map(c => c.label).join(", ") || "*empty*"}`);
	}else {
		lines.push(`> **Spread:** ${deck.spreadCardsCount || "*empty*"}`);
	}
	if (opts?.showHand || opts?.auditMode) {
		lines.push(`> **Hand:** ${deck.handCards.map(c => c.label).join(", ") || "*empty*"}`);
	}else {
		lines.push(`> **Hand:** ${deck.handCardsCount || "*empty*"}`);
	}
	return lines.join("\n");
}

type HasFrom = { from:StackKey; };
type HasTo = { to:StackKey; };
type HasWhere = { fromWhere:StackWhereKey; toWhere:StackWhereKey; };
type StackArgsResults = { _from?:string; _to?:string; _fromWhere?:string; _toWhere?:string; invalid: boolean; } & Partial<HasFrom & HasTo & HasWhere>;
function getStackArgs(sageCommand: SageCommand, def?: HasFrom): StackArgsResults & HasFrom;
function getStackArgs(sageCommand: SageCommand, def?: HasFrom & HasTo): StackArgsResults & HasFrom & HasTo;
function getStackArgs(sageCommand: SageCommand, def?: Partial<HasFrom & HasTo & HasWhere>): StackArgsResults {
	const _from = getStringArg(sageCommand, "from", "which") ?? undefined;
	const _to = getStringArg(sageCommand, "into", "to") ?? undefined;
	const _fromWhere = getStringArg(sageCommand, "fromWhere")?.toLowerCase() ?? undefined;
	const _toWhere = getStringArg(sageCommand, "toWhere", "where")?.toLowerCase() ?? undefined;

	let from = Deck.parseStackKey(_from);
	let to = Deck.parseStackKey(_to);
	let fromWhere = Deck.parseStackWhereKey(_fromWhere);
	let toWhere = Deck.parseStackWhereKey(_toWhere);

	const invalid = (!!_from && !from) || (!!_to && !to) || (!!_fromWhere && !fromWhere) || (!!_toWhere && !toWhere);

	from ??= def?.from;
	to ??= def?.to;
	fromWhere ??= def?.fromWhere;
	toWhere ??= def?.toWhere;

	return {
		_from, from,
		_to, to,
		_fromWhere, fromWhere,
		_toWhere, toWhere,
		invalid
	};
}

function getCountArgs(args: SageCommandArgs<any>) {
	const randomCount = args.getNumber("random") ?? undefined;
	if (randomCount !== undefined) {
		return { randomCount };
	}

	const upTo = args.getNumber("upTo") ?? undefined;
	if (upTo !== undefined) {
		return { upTo };
	};

	const count = args.getNumber("count") ?? 1;
	return { count };
}

/** Uses card="" or cards="" to find card(s) in the given stack for the given ordinal(s) or code(s). */
function getCardsFromArgs(sageCommand: SageCommand, deck: Deck, stackKey: StackKey) {
	const stack = deck.getStack(stackKey);
	const stackCards = stack.cards;

	const cardFromOrdinal = (ordinal: number | string) => {
		ordinal = +ordinal;
		const card = stackCards[+ordinal - 1];
		return card ? { ...card, ordinal } : undefined;
	}

	const cards: StackCard[] = [];
	const invalid: string[] = [];

	const cardValues = getStringArg(sageCommand, "card", "cards")?.toLowerCase().split(",").map(s => s.trim()).filter(s => s);
	if (!cardValues) return { stack, cards, invalid };

	const numberRegex = /^\d+$/;

	cardValues.forEach(cardValue => {
		// numbers are supposed to be ordinals
		if (numberRegex.test(cardValue)) {
			const card = cardFromOrdinal(cardValue);
			if (card) {
				cards.push(card);
				return;
			}
		}

		// let's check for card codes ...
		for (let i = 0; i < stackCards.length; i++) {
			if (stackCards[i].code === cardValue) {
				const card = cardFromOrdinal(i + 1);
				if (card) {
					cards.push(card);
					return;
				}
			}
		}

		invalid.push(deck.findCard(cardValue)?.label ?? cardValue);
	});

	return { stack, cards, invalid };
}

type DeckCommand = "draw" | "discard" | "play";
function verbify(cmd: DeckCommand) {
	switch(cmd) {
		case "discard": return { cmd, verb:"Discard", pastVerb:"Discarded" };
		case "draw": return { cmd, verb:"Draw", pastVerb:"Drew" };
		case "play": return { cmd, verb:"Play", pastVerb:"Played" };
	}
}
type PlayArgs = {
	charId?: string;
	cardIds?: number[];

	cmd: DeckCommand;
	defaultFrom: StackKey;
	defaultTo: StackKey;
};
async function _play(sageCommand: SageCommand, _playArgs: PlayArgs) {
	const { actorId, args, replyStack } = sageCommand;
	const { charId, cmd, cardIds, defaultFrom, defaultTo } = _playArgs;
	const { verb, pastVerb } = verbify(cmd);

	const char = findChar(sageCommand, { charId });
	if (!char) {
		await replyStack.reply(`Character Not Found!\nExample Usage:\n> sage! deck ${cmd} char="Gambit"`);
		return;
	}

	const stackArgs = getStackArgs(sageCommand, { from:defaultFrom, to:defaultTo });

	if (stackArgs.invalid) {
		await replyStack.reply(`Invalid ${verb} Args!\nExample Usage:\n> sage! deck ${cmd} char="Gambit"\n> sage! deck ${cmd} char="Gambit" from="${defaultFrom}"`);
		return;
	}

	const deck = char.getOrCreateDeck();

	const cardsFromArgs = getCardsFromArgs(sageCommand, deck, stackArgs.from);
	if (cardsFromArgs.invalid.length) {
		await replyStack.reply(`Cannot ${verb}: ${cardsFromArgs.invalid.join(", ")} not found in ${cardsFromArgs.stack.name}.`);
		return;
	}

	const cardArgs = cardsFromArgs.cards.length ? cardsFromArgs.cards.map(c => c.id) : undefined;
	const countArgs = getCountArgs(args);

	const deckPlayArgs = { ...stackArgs, ...countArgs, cardIds:cardIds??cardArgs } as DeckPlayArgs;

	const { fromStack, toStack, played } = deck.play(deckPlayArgs);

	if (!played.length) {
		await replyStack.reply(`Cannot ${verb}: ${fromStack.name} (${fromStack.count}), ${toStack.name} (${toStack.count})`);
		return;
	}

	const saved = await char.save();
	if (!saved) {
		await replyStack.reply(`Sorry, something went wrong trying to ${verb}!`);
		return;
	}

	const actionText = `${pastVerb} ${xCards(played)} from their ${fromStack.name} into their ${toStack.name}.`;
	const actionContent = renderAction({ actionText, actorId, char });

	const content = renderAction({ actionText, actorId, char, deck, includeState:true });
	const components = createDeckStateComponents(sageCommand, char.id, deck);

	return { char, deck, actionText, actionContent, content, components };
}
function isGatesOfKrystalia(char: GameCharacter) {
	return /gok|Gates\s*Of\s*Krystalia/i.test(char.getStat("gameSystem") ?? "");
}
function _peek(sageCommand: SageCommand, char: GameCharacter, what: "Hand" | "Spread", cards: CardBase[]) {
	const isGoK = isGatesOfKrystalia(char);
	const showCardValue = isGoK && what === "Hand";
	const showTotalValue = isGoK && what === "Spread";
	const content = `### Cards in ${what}${listCards(cards, showCardValue, showTotalValue)}`;
	return sageCommand.replyStack.whisper(content, { noDelete:true, forceEphemeral:true });
}

function _reveal(sageCommand: SageCommand, char: GameCharacter, what: "Hand" | "Spread", cards: CardBase[]) {
	const isGoK = isGatesOfKrystalia(char);
	const showCardValue = isGoK && what === "Hand";
	const showTotalValue = isGoK && what === "Spread";
	const actionText = `Reveals ${what}${listCards(cards, showCardValue, showTotalValue)}`;
	const content = renderAction({ actionText, char });
	return sageCommand.replyStack.send({ content });
}

async function showOrUpdateDeckState(sageCommand: SageCommand, { char, deck, actionContent }: { char: GameCharacter; deck: Deck; actionContent?: string; }) {
	const { actorId, replyStack } = sageCommand;

	// if we have actionContent, send it first
	if (actionContent) {
		await replyStack.send(actionContent);
	}

	// create content and components for state
	const content = renderAction({ actorId, char, deck, includeState:true });
	const components = createDeckStateComponents(sageCommand, char.id, deck);

	// check notes to see if we have a state message
	const stateMessageKey = char.notes.getCategorizedNote("deck", "stateMessageKey")?.note;
	if (stateMessageKey) {
		// split key into message reference
		const [guildId, channelId, messageId] = stateMessageKey.split("-");
		const messageReference = { guildId:guildId||undefined, channelId, messageId };

		// if we have a state message, update it
		const stateMessage = await sageCommand.discord.fetchMessage(messageReference, actorId);
		if (stateMessage) {
			await stateMessage.edit({ content, components });
			return;
		}
	}

	// we don't have an existing message, send a new one
	const message = await replyStack.send({ content, components });
	if (message) {
		// create the state message key and save it
		const stateMessageKey = `${message.guildId??""}-${message.channelId}-${message.id}`;
		const added = char.notes.setCategorizedNote("deck", "stateMessageKey", stateMessageKey);
		if (added) {
			await char.save();
		}
	}
}

async function deckReset(sageCommand: SageCommand): Promise<void> {
	const { actorId, replyStack } = sageCommand;

	const char = findChar(sageCommand);
	if (!char) {
		await replyStack.reply(`Character Not Found!\nExample Usage:\n> sage! deck reset char="Gambit"`);
		return;
	}

	const deck = char.getOrCreateDeck();
	deck.reset();

	const saved = await char.save();
	if (!saved) {
		await replyStack.reply(`Sorry, something went wrong trying to reset!`);
		return;
	}

	const actionText = `Reset Deck.`;
	const actionContent = renderAction({ actionText, actorId, char });

	await Promise.all([
		sageCommand.fetchMessage().then(deleteMessage),
		showOrUpdateDeckState(sageCommand, { char, deck, actionContent })
	]);
}

async function deckShuffle(sageCommand: SageCommand): Promise<void> {
	const { actorId, replyStack } = sageCommand;

	const char = findChar(sageCommand);
	if (!char) {
		await replyStack.reply(`Character Not Found!\nExample Usage:\n> sage! deck shuffle char="Gambit" which="drawPile"`);
		return;
	}

	const { from, to, invalid } = getStackArgs(sageCommand, { from:"drawPile" });

	if (invalid) {
		await replyStack.reply(`Invalid Shuffle Args!\nExample Usage:\n> sage! deck shuffle char="Gambit" which="drawPile"\n> sage! deck shuffle char="Gambit" which="discardPile" into="drawPile"`.trim());
		return;
	}

	const deck = char.getOrCreateDeck();

	const { fromStack, toStack } = deck.shuffle(from, to);

	const saved = await char.save();
	if (!saved) {
		await replyStack.reply(`Sorry, something went wrong trying to shuffle!`);
		return;
	}

	const actionText = toStack ? `Shuffled their ${fromStack.name} into their ${toStack.name}.` : `Shuffled their ${fromStack.name}.`;
	const actionContent = renderAction({ actionText, actorId, char });

	await Promise.all([
		sageCommand.fetchMessage().then(deleteMessage),
		showOrUpdateDeckState(sageCommand, { char, deck, actionContent })
	]);
}

async function deckDraw(sageCommand: SageCommand): Promise<void> {
	const drawResults = await _play(sageCommand, { cmd:"draw", defaultFrom:"drawPile", defaultTo:"hand" });
	if (drawResults) {
		await Promise.all([
			sageCommand.fetchMessage().then(deleteMessage),
			showOrUpdateDeckState(sageCommand, drawResults),
		]);
	}
}

async function deckDiscard(sageCommand: SageCommand): Promise<void> {
	const drawResults = await _play(sageCommand, { cmd:"discard", defaultFrom:"hand", defaultTo:"discardPile" });
	if (drawResults) {
		await Promise.all([
			sageCommand.fetchMessage().then(deleteMessage),
			showOrUpdateDeckState(sageCommand, drawResults),
		]);
	}
}

async function deckPlay(sageCommand: SageCommand): Promise<void> {
	const drawResults = await _play(sageCommand, { cmd:"play", defaultFrom:"hand", defaultTo:"spread" });
	if (drawResults) {
		await Promise.all([
			sageCommand.fetchMessage().then(deleteMessage),
			showOrUpdateDeckState(sageCommand, drawResults),
		]);
	}
}

async function deckShow(sageCommand: SageMessage): Promise<void> {
	const { actorId, replyStack } = sageCommand;

	const char = findChar(sageCommand);
	if (!char) {
		await replyStack.reply(`Character Not Found!\nExample Usage:\n> sage! deck show char="Gambit" which="drawPile"`);
		return;
	}

	const deck = char.getOrCreateDeck();

	const content = renderAction({ actorId, char, deck, includeState:true });
	const components = createDeckStateComponents(sageCommand, char.id, deck);
	await Promise.all([
		deleteMessage(await sageCommand.fetchMessage()),
		replyStack.send({ content, components }),
	]);
}

async function decksShowReveal(sageCommand: SageMessage): Promise<void> {
	const { game, replyStack } = sageCommand;

	if (!game) {
		await replyStack.reply(`Game Not Found!\n> This command only works in a Game.`);
		return;
	}

	// get all chars with decks
	const charsWithDecks: GameCharacter[] = [];
	charsWithDecks.push(...findCharsWithDecks(game.playerCharacters));
	charsWithDecks.push(...findCharsWithDecks(game.nonPlayerCharacters));
	if (game.gmCharacter.hasDecks) charsWithDecks.push(game.gmCharacter);

	// get final list of chars
	let chars: GameCharacter[] = [];

	// see if we are targeting specific characters
	const namesArg = getStringArg(sageCommand, "chars", "names", "char", "name");
	const charNames = namesArg?.split(",").map(s => s.trim()).filter(s => s);
	if (charNames?.length) {
		const invalidNames: string[] = [];
		chars = charNames.map(charName => {
			const char = charsWithDecks.find(char => char.matches(charName));
			if (!char) invalidNames.push(charName);
			return char;
		}).filter(char => char) as GameCharacter[];
		if (invalidNames.length) {
			await replyStack.reply(`Characters Not Found: ${invalidNames.join(", ")}!`);
			return;
		}

	}else {
		chars = charsWithDecks;
	}

	if (!chars.length) {
		await replyStack.reply(`Decks Not Found!`);
		return;
	}

	let content: string;
	if (/decks\s*show/i.test(sageCommand.slicedContent)) {
		content = [
			`## Show Decks`,
			...chars.map(char => renderState(char.toDisplayName(), char.getOrCreateDeck())).flat()
		].join("\n");

	}else {
		const what = /decks\s*reveal\s*(?<what>hand|spread)/i.exec(sageCommand.slicedContent)?.groups?.what ?? "spread";
		const stackKey = what.toLowerCase() as StackKey;
		content = [
			`## Reveal ${capitalize(what)}s`,
			...chars.map(char => [`### ${char.toDisplayName()}`, `${listCards(char.getOrCreateDeck().getStack(stackKey).cards)}`]).flat()
		].join("\n");
	}

	await Promise.all([
		deleteMessage(await sageCommand.fetchMessage()),
		replyStack.send({ content }),
	]);
}

function createDeckStateComponents(sageCommand: SageCommand, charId: string, deck: Deck) {
	const { actorId } = sageCommand;

	const components = [];

	if (deck.spreadCardsCount) {
		const spreadRow = new ActionRowBuilder<ButtonBuilder>();

		const discardSpread = new ButtonBuilder()
			.setCustomId(`deck|${actorId}|discardSpread|${charId}|${deck.id}`)
			.setLabel(`Discard Spread`)
			.setStyle(ButtonStyle.Danger);

		const seeSpread = new ButtonBuilder()
			.setCustomId(`deck|${actorId}|seeSpread|${charId}|${deck.id}`)
			.setLabel(`See Spread`)
		.setStyle(ButtonStyle.Primary);

		const revealSpread = new ButtonBuilder()
			.setCustomId(`deck|${actorId}|revealSpread|${charId}|${deck.id}`)
			.setLabel(`Reveal Spread`)
			.setStyle(ButtonStyle.Primary);

		spreadRow.addComponents(discardSpread, seeSpread, revealSpread);
		components.push(spreadRow);
	}

	const row = new ActionRowBuilder<ButtonBuilder>();

	if (deck.isClean) {
		const shuffleDeck = new ButtonBuilder()
			.setCustomId(`deck|${actorId}|shuffleDeck|${charId}|${deck.id}`)
			.setLabel(`Shuffle Deck`)
			.setStyle(ButtonStyle.Success);
		row.addComponents(shuffleDeck);
	}

	const drawCard = new ButtonBuilder()
		.setCustomId(`deck|${actorId}|drawCard|${charId}|${deck.id}`)
		.setLabel(`Draw Card`)
		.setStyle(ButtonStyle.Primary)
		.setDisabled(deck.drawPileCount === 0);

	const seeHand = new ButtonBuilder()
		.setCustomId(`deck|${actorId}|seeHand|${charId}|${deck.id}`)
		.setLabel(`See Hand`)
		.setStyle(ButtonStyle.Primary)
		.setDisabled(deck.handCardsCount === 0);

	const deleteButton = createMessageDeleteButton(sageCommand, { label:"Done" });

	row.addComponents(drawCard, seeHand, deleteButton);

	components.push(row);

	return components;
}

async function handleCardsButton(sageInteration: SageInteraction<ButtonInteraction>): Promise<void> {
	const { actorId, replyStack } = sageInteration;

	const { userId, action, charId, deckId } = sageInteration.parseCustomId(customId => {
		const [indicator, userId, action, charId, deckId] = customId.split("|");
		return { indicator, userId, action, charId, deckId };
	}) ?? {};

	if (userId !== actorId) {
		await replyStack.whisper(`Please don't touch their deck.`);
		return;
	}

	const char = findChar(sageInteration, { charId });
	if (!char) {
		await replyStack.whisper(`Error finding character!`);
		return;
	}

	if (!deckId || !char.hasDeck(deckId)) {
		await replyStack.whisper(`Error finding deck!`);
		return;
	}

	const deck = char.getOrCreateDeck(deckId);
	if (action === "seeHand" || action === "seeSpread") {
		const label = action === "seeHand" ? "Hand" : "Spread";
		const cards = action === "seeHand" ? deck.handCards : deck.spreadCards;
		await _peek(sageInteration, char, label, cards);

	}else if (action === "shuffleDeck") {
		const shuffleResults = deck.shuffle("drawPile");
		if (shuffleResults) {
			const actionContent = renderAction({ actionText:`Shuffled their DrawPile.`, char });
			await showOrUpdateDeckState(sageInteration, { char, deck, actionContent });
		}

	}else if (action === "drawCard") {
		const drawResults = await _play(sageInteration, { charId, cmd:"draw", defaultFrom:"drawPile", defaultTo:"hand" });
		if (drawResults) {
			await Promise.all([
				showOrUpdateDeckState(sageInteration, drawResults),
				_peek(sageInteration, char, "Hand", deck.handCards),
			]);
		}

	}else if (action === "revealHand" || action === "revealSpread") {
		replyStack.defer();
		const label = action === "revealHand" ? "Hand" : "Spread";
		const cards = action === "revealHand" ? deck.handCards : deck.spreadCards;
		await _reveal(sageInteration, char, label, cards);

	}else if (action === "discardSpread") {
		const drawResults = await _play(sageInteration, { charId, cmd:"discard", cardIds:deck.spread, defaultFrom:"spread", defaultTo:"discardPile" });
		if (drawResults) {
			await Promise.all([
				showOrUpdateDeckState(sageInteration, drawResults),
				_peek(sageInteration, char, "Spread", deck.spreadCards),
			]);
		}

	}else {
		error({customId:sageInteration.interaction.customId});
		await replyStack.whisper(`Sorry, we goofed up!`);
	}
}

function listCards(cards: CardBase[], gokValue?: boolean, gokTotal?: boolean): string {
	const valuedCards = cards.map(({ name, emoji }) => {
		const label = emoji ?? name;
		const stringValue: string | number = name.split(" ")[0];
		const letter = stringValue[0];
		const letterIndex = ["J","Q","K","A"].indexOf(letter);
		const value = letterIndex < 0 ? +stringValue : letterIndex + 11;
		return { label, value, emoji };
	});

	const { totalValue, missingEmoji, labels } = valuedCards.reduce((o, card) => {
		o.missingEmoji ||= !card.emoji;
		o.totalValue += card.value;
		if (gokValue) {
			const parts = card.label.split(":");
			if (parts[0] !== String(card.value)) {
				o.labels.push(`${card.label} (${card.value})`);
			}else {
				o.labels.push(card.label);
			}
		}else {
			o.labels.push(card.label);
		}
		return o;
	}, { totalValue:0, missingEmoji:false, labels:[] as string[] });

	const totalValueString = gokTotal ? ` = ${totalValue}` : ``;

	if (missingEmoji) {
		const cardOut = labels.map(label => `\n> - ${label}`).join("") || "*none*";
		return `${cardOut}${totalValueString}`;
	}
	return `\n> ${labels.join(` ${BULLET} `) || "*none*"}${totalValueString}`;
}

export function registerDeckCommands() {
	registerListeners({ commands:[/(deck\s*reset)/i], message:deckReset });
	registerListeners({ commands:[/(deck\s*shuffle)/i], message:deckShuffle });
	registerListeners({ commands:[/(deck\s*draw)/i], message:deckDraw });
	registerListeners({ commands:[/(deck\s*discard)/i], message:deckDiscard });
	registerListeners({ commands:[/(deck\s*play)/i], message:deckPlay });
	registerListeners({ commands:[/(deck\s*show)/i], message:deckShow });
	registerListeners({ commands:[/(decks\s*(show|reveal\s*(hand|spread)))/i], message:decksShowReveal });
	registerListeners({ commands:[/^(deck\|\d+\|(shuffleDeck|drawCard|seeHand|revealHand|seeSpread|revealSpread|discardSpread)\|[\w-]+|\d+)$/], interaction:handleCardsButton });
}