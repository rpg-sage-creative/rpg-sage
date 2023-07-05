/** Constant value that represents a nil uuid. */
export const NIL_UUID = `00000000-0000-0000-0000-000000000000` as NilUuid;

/** Constant value that represents a nil uuid. */
export type NilUuid = `00000000-0000-0000-0000-000000000000`;

/** A valid UUID can have upper- and lowercased letters. */
export type ValidUuid = `${string}-${string}-4${string}-${string}-${string}`;

/** A normalized UUID has only lowercased letters. */
export type NormalizedUuid = `${Lowercase<ValidUuid>}`;

/** A valid UUID string of the format xxxxxxxx-xxxx-4xxx-xxxx-xxxxxxxxxxxx */
export type UUID = string | ValidUuid | NormalizedUuid | NilUuid;

