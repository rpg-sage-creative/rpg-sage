import { cleanWhitespace, normalizeAscii, removeAccents } from ".";
import type { Optional } from "../..";
import type { TStringMatcher, TStringMatcherResolvable } from "./types";

/** A reusable object for comparing a string without the need to repeatedly manipulate the value. */
export default class StringMatcher implements TStringMatcher {
	public constructor(
		/** Stores the raw value. */
		public value: Optional<string>
	) { }

	/** Stores StringMatcher.clean(value) */
	public clean = StringMatcher.clean(this.value ?? "");

	/** Stores string.isBlank(value) */
	public isBlank = this.clean === "";

	/** Stores string.toLowerCase() */
	public lower = this.value?.toLowerCase() ?? "";

	/** Compares the clean values. */
	public matches(other: TStringMatcherResolvable): boolean {
		return other === null || other === undefined ? false : ((other as TStringMatcher).clean ?? StringMatcher.clean(other as string)) === this.clean;
	}
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

	/** Convenience for new StringMatcher(value) */
	public static from(value: Optional<string>): StringMatcher {
		return new StringMatcher(value);
	}
}
