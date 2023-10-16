import { cleanWhitespace, normalizeAscii, removeAccents } from ".";
import type { Optional } from "../..";
import type { TStringMatcher, TStringMatcherResolvable } from "./types";

/** A reusable object for comparing a string without the need to repeatedly manipulate the value. */
export default class StringMatcher implements TStringMatcher {
	public constructor(
		/** Stores the raw value. */
		public value: Optional<string>
	) {
		this.clean = StringMatcher.clean(this.value ?? "");
		this.isBlank = this.clean === "";
		this.lower = this.value?.toLowerCase() ?? "";
	}

	/** Stores StringMatcher.clean(value) */
	public clean: string;

	/** Stores string.isBlank(value) */
	public isBlank: boolean;

	/** Stores string.toLowerCase() */
	public lower: string;

	/** Compares the clean values. */
	public matches(other: TStringMatcherResolvable): boolean {
		return other === null || other === undefined ? false : ((other as TStringMatcher).clean ?? StringMatcher.clean(other as string)) === this.clean;
	}

	/** Compares the clean values until it finds a match. */
	public matchesAny(others: TStringMatcherResolvable[]): boolean {
		return others.find(other => this.matches(other)) !== undefined;
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
	public static matches(value: TStringMatcherResolvable, other: TStringMatcherResolvable): boolean {
		return StringMatcher.from(value).matches(other);
	}

	/** Convenience for StringMatcher.from(value).matchesAny(others) */
	public static matchesAny(value: TStringMatcherResolvable, others: TStringMatcherResolvable[]): boolean {
		return StringMatcher.from(value).matchesAny(others);
	}

	/** Convenience for new StringMatcher(value) */
	public static from(value: Optional<TStringMatcherResolvable>): StringMatcher {
		return new StringMatcher(value instanceof StringMatcher ? value.value : value as string);
	}
}
