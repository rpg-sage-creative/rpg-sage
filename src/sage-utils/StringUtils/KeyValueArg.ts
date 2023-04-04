import { dequote, getQuotedRegexSource, quote } from "./quotes";

export type KeyValueArg<T extends string = string> = {
	/** key */
	key: string;

	/** key.toLowerCase() */
	keyLower: string;

	/** value (can have spaces) */
	value: T;

	/** keyLower="value" (value can have spaces, not trimmed) */
	clean: string;

	/**
	 * keyLower=value (value can have spaces, trimmed)
	 * @deprecated recode to use .clean or just .value
	 */
	simple: string;
};

/** Returns the string source of our word character regex. */
function getWordCharSource(s: "*" | "+" | ""): string {
	return `[\\w\\pL\\pN]${s}`;
}

/** Returns the string source of our key/value regex. */
function getKeyValueArgSource(key: string = getWordCharSource("+")): string {
	const value = `(?:${getQuotedRegexSource("*")}|\\S+)`;
	return `${key}\\s*=+\\s*${value}`;
}

/** Convenience for creating/sharing key=value regex in case we change it later. Passing in a key will make sure they keys match. */
export function createKeyValueArgRegex(key?: string): RegExp {
	return new RegExp(getKeyValueArgSource(key), "i");
}

/** Returns true if the value is key=value or key="value" or key="", false otherwise. Passing in a key will make sure they keys match. */
export function isKeyValueArg(value: string, key?: string): boolean {
	const regex = new RegExp(`^${getKeyValueArgSource(key)}$`, "i");
	return value.match(regex) !== null;
}

/** Returns [key, value, key=value] if the input is a valid key/value pairing, null otherwise */
export function parseKeyValueArg(input: string, key?: string): KeyValueArg | null {
	if (isKeyValueArg(input, key)) {
		const index = input.indexOf("=");
		const key = input.slice(0, index);
		const keyLower = key.toLowerCase();
		const value = dequote(input.slice(index + 1).trim());
		const quoted = quote(value);
		const clean = `${keyLower}=${quoted}`;
		const simple = `${keyLower}=${value.trim()}`;
		return { key, keyLower, value, clean, simple };
	}
	return null;
}
