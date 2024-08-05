import { getQuotedRegexSource } from "../quote/getQuotedRegexSource.js";
import { getWordCharacterRegexSource } from "../regex/getWordCharacterRegexSource.js";

/**
 * @internal
 * Returns the string source of our key/value regex.
 * @todo redo this logic to enforce a strict no space policy.
 */
export function getKeyValueArgSource(key?: string): string {
	key = key ?? getWordCharacterRegexSource({ allowDashes:true, allowPeriods:true, quantifier:"+" });
	const quotedRegexSource = getQuotedRegexSource({ lengthQuantifier:"*" });
	return `${key}=(?:${quotedRegexSource}|\\S+)`;
}