import type { Optional } from "../types/generics.js";
import { isNullOrUndefined } from "../types/index.js";
import type { Matcher, MatcherResolvable } from "../types/Matcher.js";
import { isNilUuid } from "./isNilUuid.js";
import { isNonNilUuid } from "./isNonNillUuid.js";
import { isUuid } from "./isUuid.js";
import { orNilUuid } from "./orNilUuid.js";
import type { UUID } from "./types.js";

/** Convenience type for UUID | UuidMatcher */
export type UuidMatcherResolvable = Optional<UUID> | UuidMatcher;

/** A reusable object for comparing a UUID without the need to repeatedly manipulate the value. */
export class UuidMatcher implements Matcher<UUID> {
	public constructor(value: Optional<UUID>) {
		this.value = value;
	}

	/** Stores isNonNilUuid(value) */
	private _isNonNil?: boolean;

	/** Returns isNonNilUuid(value) */
	public get isNonNil(): boolean {
		return this._isNonNil ?? (this._isNonNil = isNonNilUuid(this.value));
	}

	/** Stores isUuid(value) */
	private _isValid?: boolean;

	/** Returns isUuid(value) */
	public get isValid(): boolean {
		return this._isValid ?? (this._isValid = isUuid(this.value));
	}

	/** The value used to compare to other values. */
	private _matchValue?: UUID;

	/** The value used to compare to other values. */
	public get matchValue(): UUID {
		return this._matchValue ?? (this._matchValue = orNilUuid(this.value));
	}

	/** Stores the raw value. */
	public value: Optional<UUID>;

	/** Returns true if the given value is considered a match. */
	public matches<T extends MatcherResolvable>(other: T): boolean {
		if (!this.isValid || isNullOrUndefined(other)) {
			return false;
		}
		if (typeof(other) === "string") {
			if (this.isNonNil) {
				return this.matchValue === orNilUuid(other);
			}
			return isNilUuid(other);
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
	public toString(): Optional<UUID> {
		return this.value;
	}

	/** Convenience method for new UuidMatcher(value) */
	public static from(value: Optional<MatcherResolvable>): UuidMatcher {
		return new UuidMatcher((typeof(value) === "string" ? value : value?.value) as UUID);
	}
}
