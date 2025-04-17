import { escapeRegex } from "../regex/escapeRegex.js";
import type { Optional } from "../types/generics.js";
import { isDefined, isNullOrUndefined } from "../types/index.js";
import type { Matcher, MatcherResolvable } from "../types/Matcher.js";
import { isBlank } from "./blank/isBlank.js";
import { isNotBlank } from "./blank/isNotBlank.js";
import { normalizeAscii } from "./normalize/normalizeAscii.js";
import { removeAccents } from "./normalize/removeAccents.js";
import { cleanWhitespace } from "./whitespace/cleanWhitespace.js";
import { getWhitespaceRegex, HORIZONTAL_WHITESPACE_REGEX_SOURCE, WHITESPACE_REGEX_SOURCE } from "./whitespace/getWhitespaceRegex.js";

type StringMatcherToRegExpOptions = {
	/** if set to true, then a * in the value is treated as .*? in the regexp */
	asterisk?: boolean;
	/** if set to "optional" then a whitespace charater in the value is treated as \s* in the regexp */
	whitespace?: "optional";
	/** if set to true then only horizontal whitespace will be made optional */
	horizontalOnly?: boolean;
};

/** A reusable object for comparing a string without the need to repeatedly manipulate the value. */
export class StringMatcher implements Matcher {
	public constructor(value: Optional<string>) {
		this.value = value;
	}

	/** Stores isNotBlank(value) */
	private _isNonNil?: boolean;

	/** Returns isNotBlank(value) */
	public get isNonNil(): boolean {
		return this._isNonNil ?? (this._isNonNil = isNotBlank(this.value));
	}

	/** Stores isDefined(value) */
	private _isValid?: boolean;

	/** Returns isDefined(value) */
	public get isValid(): boolean {
		return this._isValid ?? (this._isValid = isDefined(this.value));
	}

	private _lower?: string;
	public get lower(): string {
		return this._lower ?? (this._lower = this.value?.toLowerCase() ?? "");
	}

	/** The value used to compare to other values. */
	private _matchValue?: string;

	/** The value used to compare to other values. */
	public get matchValue(): string {
		return this._matchValue ?? (this._matchValue = StringMatcher.clean(this.value));
	}

	/** Stores the raw value. */
	public value: Optional<string>;

	/** Compares the clean values. */
	public matches<T extends MatcherResolvable>(other: T): boolean {
		if (!this.isValid || isNullOrUndefined(other)) {
			return false;
		}
		if (typeof(other) === "string") {
			if (this.isNonNil) {
				return this.matchValue === StringMatcher.clean(other);
			}
			return isBlank(other);
		}
		if (!other.isValid || this.isNonNil !== other.isNonNil) {
			return false;
		}
		return this.matchValue === other.matchValue;
	}

	/** Returns true if any of the given values are considered a match. */
	public matchesAny<T extends MatcherResolvable>(values: T[]): boolean;

	/** Returns true if any of the given values are considered a match. */
	public matchesAny<T extends MatcherResolvable>(...values: T[]): boolean;

	public matchesAny<T extends MatcherResolvable>(...args: T[]): boolean {
		return args.flat(1).some(value => this.matches(value));
	}

	/** Converts the matchValue into a regular expression. */
	public toRegex({ asterisk, horizontalOnly, whitespace }: StringMatcherToRegExpOptions = {}): RegExp {
		// reuse cached regex for whitespace
		const whitespaceRegex = getWhitespaceRegex({ horizontalOnly, quantifier:undefined });
		const whitespaceSource = horizontalOnly ? HORIZONTAL_WHITESPACE_REGEX_SOURCE : WHITESPACE_REGEX_SOURCE;
		const whitespaceQuantifier = whitespace === "optional" ? "*" : "+";

		let lastCharWasWhitespace = false;
		const regex = this.value?.split("").map(char => {
			// don't be greedy
			if (char === "*" && asterisk) {
				return ".*?";
			}

			// deal with whitespace options
			if (whitespaceRegex.test(char)) {
				// we only include whitespace char class once
				if (!lastCharWasWhitespace) {
					// toggle the flag to true
					lastCharWasWhitespace = true;
					// add char class and quantifier
					return whitespaceSource + whitespaceQuantifier;
				}
				return "";
			}

			// toggle the flag to false
			lastCharWasWhitespace = false;

			// clean the character
			const cleaned = StringMatcher.clean(char);

			// escape the character
			const escaped = escapeRegex(cleaned);

			// something changed, so lets do a character class or non-capture group
			// ex: ë gets cleaned to e, so we want our regex to match [eë]
			if (char !== cleaned && char !== cleaned.toUpperCase()) {
				// if 1 char is cleaned to 1 char and it doesn't get escaped, use a character class
				if (char.length === 1 && cleaned.length === 1 && cleaned === escaped) {
					return `[${char}${cleaned}]`;
				}else {
					return `(?:${char}|${escaped})`;
				}
			}

			// finally, return the escaped character
			return escaped;
		}).join("") ?? "";

		return new RegExp(`^${regex}$`, "i");
	}

	/** Returns the original value. */
	public toString(): Optional<string> {
		return this.value;
	}

	/**
	 * Cleans the given value to make comparisons more reliable.
	 * Convenience for cleanWhitespace(normalizeAscii(removeAccents(String(value ?? "")))).toLowerCase()
	 */
	public static clean(value: Optional<string>): string {
		return cleanWhitespace(normalizeAscii(removeAccents(String(value ?? "")))).toLowerCase();
	}

	/** Convenience for StringMatcher.from(value).matches(other) */
	public static matches(value: MatcherResolvable, other: MatcherResolvable): boolean {
		return StringMatcher.from(value).matches(other);
	}

	/** Convenience for StringMatcher.from(value).matchesAny(others) */
	public static matchesAny(value: MatcherResolvable, others: MatcherResolvable[]): boolean {
		return StringMatcher.from(value).matchesAny(others);
	}

	/** Convenience for new StringMatcher(value) */
	public static from(value: Optional<MatcherResolvable>): StringMatcher {
		if (isDefined(value)) {
			return new StringMatcher(typeof(value) === "string" ? value : value?.value);
		}
		return new StringMatcher(value);
	}
}
