/**
 * Represents a key/value argument and frequently accessed properties.
 */
export type KeyValueArg<T extends string = string> = {
	/** key */
	key: string;

	/** key.toLowerCase() */
	keyLower: string;

	/** value (can have spaces) */
	value: T;

	/** keyLower="value" (value can have spaces, not trimmed) */
	clean: string;
};
