import * as _XRegExp from "xregexp";
import utils from "../../../sage-utils";
import type { EmojiType, IEmoji } from "./HasEmojiCore";
const XRegExp: typeof _XRegExp = (_XRegExp as any).default;

export type TEmojiAndType = { type: EmojiType; replacement: string; };

const actionMatches = ["A", "AA", "AAA", "R", "F"];
function emojify(text: string, matches: string[], replacement: string): string {
	if (!text || !matches.length) {
		return text;
	}

	const markedMatches: string[] = [];
	matches.forEach(match => {
		markedMatches.push(`[${match}]`);
		if (actionMatches.includes(match)) {
			markedMatches.push(`[${match.split("").join("][")}]`, `{${match}}`, `(${match})`);
		}
		return markedMatches;
	});

	const parsers = {
		boundary: /:/,
		emoji: XRegExp(markedMatches.map(XRegExp.escape).join("|"))
	};

	const tokenized = utils.StringUtils.Tokenizer.tokenize(text, parsers).map((token, i, arr) => {
		if (token.type !== "emoji") {
			return token.token;
		}
		if (arr[i - 1]?.token === ":" && arr[i + 1]?.token === ":") {
			return token.token;
		}
		return replacement;
	});

	return tokenized.join("");
}

export default class Emoji {
	public constructor(private emoji: IEmoji[]) { }

	private findEmoji(type: EmojiType): IEmoji | undefined {
		return this.emoji.find(emoji => emoji.type === type);
	}

	public get size(): number {
		return this.emoji.length;
	}

	// #region get/set/unset

	public get(type: EmojiType): string | null {
		return this.findEmoji(type)?.replacement ?? null;
	}

	public set(type: EmojiType, replacement: string): boolean {
		if (!replacement) {
			return false;
		}

		let found = this.findEmoji(type);
		if (!found) {
			found = { type: type, matches: [], replacement: undefined! };
			this.emoji.push(found);
		}

		found.replacement = replacement;
		return true;
	}

	public unset(type: EmojiType): boolean {
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
