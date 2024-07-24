/** A Constant value that represents a nil UUID. */
export const NIL_UUID = "00000000-0000-0000-0000-000000000000" as NIL_UUID;

/** A nil UUID has all 0s. */
export type NIL_UUID = UUID & { nil:never; };

export type UUID = `${string}-${string}-${string}-${string}-${string}`;
