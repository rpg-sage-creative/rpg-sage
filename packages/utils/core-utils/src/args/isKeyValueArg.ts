import type { RegexWordCharOptions } from "../characters/getWordCharacterRegex.js";
import type { RegExpQuoteOptions } from "../string/index.js";
import { getKeyValueArgRegex, type RegExpKeyValueArgOptions } from "./getKeyValueArgRegex.js";

type Options = RegexWordCharOptions & RegExpQuoteOptions & RegExpKeyValueArgOptions;

/**
 * Returns true if the value is `key=value` or `key="value"` or `key=""`.
 * If a key is given, then the key must match.
 * The key/value pair must be "anchored" for this to return true.
 */
export function isKeyValueArg(value: string, options?: Options): boolean {
	return getKeyValueArgRegex({ anchored:true, ...options }).test(value);
}