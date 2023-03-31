/** Constant value that represents a nil uuid. */
export const NIL_UUID = "00000000-0000-0000-0000-000000000000" as NIL_UUID;

/** A nil UUID has all 0s. */
export type NIL_UUID = string & { nil_uuid:never; };

/** A normalized UUID has only lowercased letters, can also be Nil. */
export type NORMALIZED_UUID = string & { normalized_uuid:never; };

/** A valid UUID can have upper- and lowercased letters, can also be Nil. */
export type VALID_UUID = string & { valid_uuid:never; };

/** A valid UUID string of the format xxxxxxxx-xxxx-4xxx-xxxx-xxxxxxxxxxxx */
export type UUID = string | NIL_UUID | NORMALIZED_UUID | VALID_UUID;

