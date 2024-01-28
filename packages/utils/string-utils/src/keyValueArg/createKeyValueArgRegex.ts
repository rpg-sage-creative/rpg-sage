import XRegExp from "xregexp";
import { getKeyValueArgSource } from "./getKeyValueArgSource.js";

/**
 * Convenience for creating/sharing key=value regex in case we change it later.
 */
export function createKeyValueArgRegex(): RegExp;

/**
 * Convenience for creating/sharing key=value regex in case we change it later.
 * Matches the given key.
 */
export function createKeyValueArgRegex(key: string): RegExp;

export function createKeyValueArgRegex(key?: string): RegExp {
	return XRegExp(getKeyValueArgSource(key), "i");
}