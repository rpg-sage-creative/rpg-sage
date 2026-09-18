/** A Constant value that represents a nil UUID. */
export { NIL as NIL_UUID, MAX as MAX_UUID } from "uuid";

/** A nil UUID: 00000000-0000-0000-0000-000000000000 */
export type NIL_UUID = UUID & { nil:never; };

/** A max UUID: ffffffff-ffff-ffff-ffff-ffffffffffff */
export type MAX_UUID = UUID & { max:never; };

/** A string formatted like a UUID, accepting upper or lower case. */
export type UUID = `${string}-${string}-${string}-${string}-${string}`;

/** A "strict" lowercased UUID. */
export type STRICT_UUID = Lowercase<UUID>;
