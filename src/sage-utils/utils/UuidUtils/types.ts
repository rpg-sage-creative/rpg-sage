import type { TMatcher } from "../types";

/** A nil UUID has all 0s. */
export type NIL_UUID = string & { nil_uuid:never; };
/** A normalized UUID has only lowercased letters, can also be Nil. */
export type NORMALIZED_UUID = string & { normalized_uuid:never; };
/** A valid UUID can have upper- and lowercased letters, can also be Nil. */
export type VALID_UUID = string & { valid_uuid:never; };
/** A valid UUID string of the format xxxxxxxx-xxxx-4xxx-xxxx-xxxxxxxxxxxx */
export type UUID = string | NIL_UUID | NORMALIZED_UUID | VALID_UUID;

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