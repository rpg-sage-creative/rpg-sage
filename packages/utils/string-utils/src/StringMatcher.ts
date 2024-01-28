import { isDefined, type Matcher, type MatcherResolvable, type Optional } from "@rsc-utils/type-utils";
import { isBlank } from "./blank/isBlank.js";
import { isNotBlank } from "./blank/isNotBlank.js";
import { normalizeAscii } from "./normalize/normalizeAscii.js";
import { removeAccents } from "./normalize/removeAccents.js";
import { cleanWhitespace } from "./whitespace/cleanWhitespace.js";

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
	public value?: string | null;

	/** Compares the clean values. */
	public matches<T extends MatcherResolvable>(other: T): boolean {
		if (!this.isValid || other === null || other === undefined) {
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
	public static matches(value: MatcherResolvable, other: MatcherResolvable): boolean {
		return StringMatcher.from(value).matches(other);
	}

	/** Convenience for StringMatcher.from(value).matchesAny(others) */
	public static matchesAny(value: MatcherResolvable, others: MatcherResolvable[]): boolean {
		return StringMatcher.from(value).matchesAny(others);
	}

	/** Convenience for new StringMatcher(value) */
	public static from(value: Optional<MatcherResolvable>): StringMatcher {
		return new StringMatcher(typeof(value) === "string" ? value : value?.value);
	}
}
