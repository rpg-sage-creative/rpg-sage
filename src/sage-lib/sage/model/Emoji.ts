import XRegExp from "xregexp";
import { tokenize } from "../../../sage-utils/StringUtils";

//#region types

export enum EmojiType {

	// Command = 1,
	CommandSuccess = 11,
	CommandFailure = 12,
	CommandWarn = 13,
	CommandError = 14,
	CommandDelete = 15,
	CommandPin = 16,

	// Permission = 2
	PermissionDenied = 21,
	PermissionPatreon = 22,

	// Actions = 3
	ActionsOne = 31,
	ActionsTwo = 32,
	ActionsThree = 33,
	ActionsReaction = 34,
	ActionsFree = 35,

	// Dice
	Die = 4,
	DieCriticalSuccess = 41,
	DieSuccess = 42,
	DieFailure = 43,
	DieCriticalFailure = 44,
	DieDamage = 45,
	DieTestConcealed = 461,
	DieTestConcealedSuccess = 4611,
	DieTestConcealedFailure = 4612,
	DieTestHidden = 462,
	DieTestHiddenSuccess = 4621,
	DieTestHiddenFailure = 4622,
	DieTestUndetected = 463,
	DieTestUndetectedSuccess = 4631,
	DieTestUndetectedFailure = 4632,
	DieTestDeafened = 464,
	DieTestDeafenedSuccess = 4641,
	DieTestDeafenedFailure = 4642,
	DieTestStupefied = 465,
	DieTestStupefiedSuccess = 4651,
	DieTestStupefiedFailure = 4652,

	// Dialog = 5
	DialogEyes = 51,
	DialogLook = 52,
	DialogSpeech = 53,
	DialogThought = 54,

	// Condition = 6
	ConditionDead = 61,
	ConditionUnconcious = 62,

	// Prompt = 7
	PromptSpacer = 70,
	PromptChecked = 701,
	PromptUnchecked = 702,
	PromptYes = 71,
	PromptNo = 711,

	// Other = 9
	AoN = 90
}

export type EmojiData = {
	type: EmojiType;
	matches: string[];
	replacement: string;
};

//#endregion

//#region interfaces

export interface CoreWithEmoji {
	emoji?: EmojiData[];
}

export interface HasCoreWithEmoji {
	emoji: Emoji;
	emojify(text: string): string;
}

//#endregion

//#region helpers

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
		emoji: XRegExp(markedMatches.map(XRegExp.escape).join("|"), "i")
	};

	const tokenized = tokenize(text, parsers).map((token, i, arr) => {
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

//#endregion

export class Emoji {
	public constructor(private emoji: EmojiData[]) { }

	private findEmoji(type: EmojiType): EmojiData | undefined {
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

	public toArray(): EmojiData[] {
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
