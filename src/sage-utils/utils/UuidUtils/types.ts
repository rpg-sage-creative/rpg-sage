/** A valid UUID string of the format xxxxxxxx-xxxx-4xxx-xxxx-xxxxxxxxxxxx */
export type NIL_UUID = string & { nil:never; };
export type NORMALIZED_UUID = string & { normalized:never; };
export type VALID_UUID = string & { valid:never; };
export type UUID = string | NIL_UUID | NORMALIZED_UUID | VALID_UUID;

/** Contains all the properties that represent a UuidMatcher. */
export type TUuidMatcher = {
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