import { isValid } from ".";
import { NilUuid } from "./consts";
import type { TUuidMatcher, TUuidMatcherResolvable, UUID } from "./types";

/** A reusable object for comparing a UUID without the need to repeatedly manipulate the value. */
export default class UuidMatcher implements TUuidMatcher {
	public constructor(
		/** Stores the raw value. */
		public value: UUID
	) {
		this.isValid = isValid(this.value);
		this.normalized = this.isValid ? this.value.toLowerCase() : NilUuid;
		this.isNormalized = this.isValid && this.value === this.normalized;
	}

	/** Stores UuidUtils.isValid(value). */
	public isValid: boolean;
	/** Stores UuidUtils.normalize(value). */
	public normalized: string;
	/** Stores UuidUtils.isNormalized(value). */
	public isNormalized: boolean;

	/** Compares a given value (a matcher's normalized value or a .toLowerCase()) to this.normalized */
	public matches(other: TUuidMatcherResolvable): boolean {
		return ((other as TUuidMatcher).normalized ?? String(other).toLowerCase()) === this.normalized;
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
