/** A string of 15 or more numberic characters. */
export type Snowflake = `${bigint}`;

/** A string formatted like a UUID, accepting upper or lower case. */
export type UUID = `${string}-${string}-${string}-${string}-${string}`;
