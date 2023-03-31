import type { Optional, TMatcher, TMatcherResolvable } from "..";
import { normalizeAscii, removeAccents } from "./normalize";
import { cleanWhitespace } from "./whitespace";

//#region StringMatcher.ts

/** Contains all the properties that represent a StringMatcher. */
export type TStringMatcher = TMatcher & {

	/** Stores StringMatcher.clean(value) */
	clean: string;

	/** Stores string.isBlank(value) */
	isBlank: boolean;

	/** Stores string.toLowerCase() */
	lower: string;

	/** Stores the raw value. */
	value: Optional<string>;
};

/** Convenience type for Optional<string> | TStringMatcher */
export type TStringMatcherResolvable = Optional<string> | TStringMatcher;

//#endregion

/** A reusable object for comparing a string without the need to repeatedly manipulate the value. */
export class StringMatcher implements TStringMatcher {
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
	public matches(other: TMatcherResolvable): boolean;
	public matches(other: TStringMatcherResolvable): boolean;
	public matches(other: TStringMatcherResolvable): boolean {
		if (other === null || other === undefined) {
			return false;
		}
		const otherClean = (other as TStringMatcher).clean ?? StringMatcher.clean(String(other));
		return otherClean === this.clean;
	}

	/** Compares the clean values until it finds a match. */
	public matchesAny(others: TStringMatcherResolvable[]): boolean {
		return others.find(other => this.matches(other)) !== undefined;
	}

	/** Returns the original value. */
	public toString(): string {
		return this.value ?? "";
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
