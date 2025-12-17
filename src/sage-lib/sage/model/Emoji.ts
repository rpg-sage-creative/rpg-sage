import type { Optional } from "@rsc-utils/core-utils";
import { tokenize } from "@rsc-utils/core-utils";
import type { EmojiType, IEmoji } from "./HasEmojiCore.js";

export type TEmojiAndType = { type: EmojiType; replacement: string; };

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

export class Emoji {
	public constructor(private emoji: IEmoji[]) { }

	public findEmoji(type: Optional<EmojiType>): IEmoji | undefined {
		return this.emoji.find(emoji => emoji.type === type);
	}

	public get size(): number {
		return this.emoji.length;
	}

	// #region get/set/unset

	public get(type: EmojiType): string | null {
		return this.findEmoji(type)?.replacement ?? null;
	}

	public set(emoji: IEmoji): boolean {
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

	public sync(emoji: Emoji): boolean {
		const oldEmoji = this.emoji.slice();
		this.emoji.length = 0;
		this.emoji.push(...emoji.toArray());
		return emoji.size !== oldEmoji.length
			|| this.emoji.find((_, i) => oldEmoji[i].type !== this.emoji[i].type || oldEmoji[i].replacement !== this.emoji[i].replacement) !== undefined;
	}

	public toArray(): IEmoji[] {
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
