import type { Optional, TMatcher, TMatcherResolvable } from "..";
import { isNilSnowflake, isNonNilSnowflake, isSnowflake } from "./helpers";
import type { Snowflake } from "./types";

//#region types

/** Contains all the properties that represent a TSnowflakeMatcher. */
export type TSnowflakeMatcher = TMatcher & {
	/** Stores isNonNilSnowflake */
	isNonNil: boolean;
	/** Stores isSnowflake(value) */
	isValid: boolean;
	/** Stores the raw value. */
	value: Snowflake;
}

/** Convenience type for Snowflake | TSnowflakeMatcher */
export type TSnowflakeMatcherResolvable = Optional<Snowflake> | TSnowflakeMatcher;

//#endregion

/** A reusable object for comparing a UUID without the need to repeatedly manipulate the value. */
export class SnowflakeMatcher implements TSnowflakeMatcher {
	public constructor(
		/** Stores the raw value. */
		public value: Snowflake
	) { }

	/** Stores isNonNilSnowflake */
	public isNonNil = isNonNilSnowflake(this.value);

	/** Stores isSnowflake(value). */
	public isValid = isSnowflake(this.value);

	/** Compares a given value (a matcher's value to this.value or isNilSnowflake) */
	public matches(other: TMatcherResolvable): boolean;
	public matches(other: TSnowflakeMatcherResolvable): boolean;
	public matches<T extends TSnowflakeMatcherResolvable>(other: T): boolean {
		if (other === null || other === undefined) {
			return false;
		}
		const otherValue = typeof(other) === "string" ? other : other.value;
		if (this.isValid) {
			if (this.isNonNil) {
				return otherValue === this.value;
			}
			return isNilSnowflake(otherValue);
		}
		return false;
	}

	/** Returns the original value. */
	public toString(): string {
		return this.value;
	}

	/** Convenience method for new UuidMatcher(value) */
	public static from(value: Optional<TSnowflakeMatcherResolvable>): SnowflakeMatcher {
		return new SnowflakeMatcher(value instanceof SnowflakeMatcher ? value.value : value as string ?? "");
	}
}
