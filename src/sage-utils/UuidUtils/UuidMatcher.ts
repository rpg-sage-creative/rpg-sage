
import type { TMatcher, TMatcherResolvable } from "..";
import { isValid } from "./helpers";
import { NIL_UUID, UUID } from "./types";

/** Contains all the properties that represent a UuidMatcher. */
export type TUuidMatcher = TMatcher & {
	/** Stores UuidUtils.isNormalized(value). */
	isNormalized: boolean;
	/** Stores UuidUtils.isValid(value). */
	isValid: boolean;
	/** Stores UuidUtils.normalize(value). */
	normalized: UUID;
	/** Stores the raw value. */
	value: UUID;
};

/** Convenience type for UUID | TUuidMatcher */
export type TUuidMatcherResolvable = UUID | TUuidMatcher;

/** A reusable object for comparing a UUID without the need to repeatedly manipulate the value. */
export class UuidMatcher implements TUuidMatcher {
	public constructor(
		/** Stores the raw value. */
		public value: UUID
	) { }

	/** Stores UuidUtils.isValid(value). */
	public isValid = isValid(this.value);
	/** Stores UuidUtils.normalize(value). */
	public normalized = this.isValid ? this.value.toLowerCase() : NIL_UUID;
	/** Stores UuidUtils.isNormalized(value). */
	public isNormalized = this.isValid && this.value === this.normalized;

	/** Compares a given value (a matcher's normalized value or a .toLowerCase()) to this.normalized */
	public matches(other: TMatcherResolvable): boolean;
	/** Compares a given value (a uuid matcher's normalized value or a .toLowerCase()) to this.normalized */
	public matches(other: TUuidMatcherResolvable): boolean;
	public matches(other: TUuidMatcherResolvable): boolean {
		if (other === null || other === undefined) {
			return false;
		}
		const otherValue = (other as TUuidMatcher).normalized ?? String(other).toLowerCase();
		return otherValue === this.normalized;
	}

	/** Returns the original value. */
	public toString(): string {
		return this.value;
	}

	/** Convenience method for new UuidMatcher(value) */
	public static from(value: UUID): UuidMatcher {
		return new UuidMatcher(value);
	}
}
