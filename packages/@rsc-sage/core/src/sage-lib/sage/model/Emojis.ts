import type { Emoji, EmojiType } from "@rsc-sage/data-layer";
import type { Optional } from "@rsc-utils/core-utils";
import { tokenize } from "@rsc-utils/core-utils";

export type EmojiAndType = { type: EmojiType; replacement: string; };

function emojify(text: string, matches: string[], replacement: string): string {
	if (!text || !matches.length) {
		return text;
	}

	const emojiRegexParts = matches.map(match => `\\[${match.replace(/-/, `[ -]?`)}\\]`);
	const emojiRegex = new RegExp(emojiRegexParts.join("|"), "i");

	const parsers = {
		redacted: /```[^`]*```|``[^`]*``|`[^`]*`/,
		emoji: emojiRegex
	};

	const tokenized = tokenize(text, parsers).map(token => {
		if (token.key !== "emoji") {
			return token.token;
		}
		return replacement;
	});

	return tokenized.join("");
}

export type HasEmojiCore = {
	emoji: Emojis;
	emojify(text: string): string;
};

export class Emojis {
	public constructor(private emoji: Emoji[]) { }

	public findEmoji(type: Optional<EmojiType>): Emoji | undefined {
		return this.emoji.find(emoji => emoji.type === type);
	}

	public get size(): number {
		return this.emoji.length;
	}

	// #region get/set/unset

	public get(type: EmojiType): string | undefined {
		return this.findEmoji(type)?.replacement ?? undefined;
	}

	public set(emoji: Emoji): boolean {
		if (!emoji?.replacement || !emoji?.type || !emoji.matches?.length) {
			return false;
		}

		let found = this.findEmoji(emoji.type);
		if (!found) {
			found = { ...emoji };
			this.emoji.push(found);
		}

		found.matches = emoji.matches;
		found.replacement = emoji.replacement;

		return true;
	}

	public unset(type: Optional<EmojiType>): boolean {
		const found = this.findEmoji(type);
		if (!found) {
			return false;
		}

		this.emoji.splice(this.emoji.indexOf(found), 1);
		return true;
	}

	// #endregion

	public sync(emojis: Emojis): boolean {
		const oldEmoji = this.emoji.slice();
		this.emoji.length = 0;
		this.emoji.push(...emojis.toArray());
		return emojis.size !== oldEmoji.length
			|| this.emoji.find((_, i) => oldEmoji[i].type !== this.emoji[i].type || oldEmoji[i].replacement !== this.emoji[i].replacement) !== undefined;
	}

	public toArray(): Emoji[] {
		return this.emoji.map(({ type, matches, replacement }) => ({ type, matches: matches.slice(), replacement }));
	}

	public emojify(text: string): string {
		if (!text) {
			return text;
		}
		this.emoji.forEach(emoji => text = emojify(text, emoji.matches ?? [], emoji.replacement));
		return text;
	}

}
