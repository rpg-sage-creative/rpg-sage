import { isValid } from ".";
import type { TMatcherResolvable } from "../types";
import { NilUuid } from "./consts";
import type { TUuidMatcher, TUuidMatcherResolvable, UUID } from "./types";

/** A reusable object for comparing a UUID without the need to repeatedly manipulate the value. */
export default class UuidMatcher implements TUuidMatcher {
	public constructor(
		/** Stores the raw value. */
		public value: UUID
	) { }

	/** Stores UuidUtils.isValid(value). */
	public isValid = isValid(this.value);
	/** Stores UuidUtils.normalize(value). */
	public normalized = this.isValid ? this.value.toLowerCase() : NilUuid;
	/** Stores UuidUtils.isNormalized(value). */
	public isNormalized = this.isValid && this.value === this.normalized;

	/** Compares a given value (a matcher's normalized value or a .toLowerCase()) to this.normalized */
	public matches(other: TMatcherResolvable): boolean;
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
