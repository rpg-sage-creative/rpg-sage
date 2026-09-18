import { isNullOrUndefined, type Matcher, type MatcherResolvable, type Optional } from "@rsc-utils/type-utils";
import { isNilSnowflake } from "./isNilSnowflake.js";
import { isNonNilSnowflake } from "./isNonNilSnowflake.js";
import { isSnowflake } from "./isSnowflake.js";
import { orNilSnowflake } from "./orNilSnowflake.js";
import type { Snowflake } from "./types.js";

/** Convenience type for Snowflake | SnowflakeMatcher */
export type SnowflakeMatcherResolvable = Optional<Snowflake> | SnowflakeMatcher;

/** A reusable object for comparing a UUID without the need to repeatedly manipulate the value. */
export class SnowflakeMatcher implements Matcher<Snowflake> {
	public constructor(value: Optional<Snowflake>) {
		this.value = value;
	}

	/** Stores isNonNilSnowflake(value) */
	private _isNonNil?: boolean;

	/** Returns isNonNilSnowflake(value) */
	public get isNonNil(): boolean {
		return this._isNonNil ?? (this._isNonNil = isNonNilSnowflake(this.value));
	}

	/** Stores isSnowflake(value) */
	private _isValid?: boolean;

	/** Returns isSnowflake(value) */
	public get isValid(): boolean {
		return this._isValid ?? (this._isValid = isSnowflake(this.value));
	}

	/** The value used to compare to other values. */
	private _matchValue?: Snowflake;

	/** The value used to compare to other values. */
	public get matchValue(): Snowflake {
		return this._matchValue ?? (this._matchValue = orNilSnowflake(this.value));
	}

	/** Stores the raw value. */
	public value: Optional<Snowflake>;

	/** Returns true if the given value is considered a match. */
	public matches<T extends MatcherResolvable>(other: T): boolean {
		if (!this.isValid || isNullOrUndefined(other)) {
			return false;
		}
		if (typeof(other) === "string") {
			if (this.isNonNil) {
				return this.matchValue === orNilSnowflake(other);
			}
			return isNilSnowflake(other);
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
	public toString(): Optional<Snowflake> {
		return this.value;
	}

	/** Convenience method for new SnowflakeMatcher(value) */
	public static from(value: Optional<MatcherResolvable>): SnowflakeMatcher {
		return new SnowflakeMatcher((typeof(value) === "string" ? value : value?.value) as Snowflake);
	}
}
