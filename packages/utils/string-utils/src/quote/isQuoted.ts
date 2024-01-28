import XRegExp from "xregexp";
import { getQuotedRegexSource } from "./getQuotedRegexSource.js";

/** Returns true if the value begins and ends in quotes, false otherwise. */
export function isQuoted(value: string): boolean {
	return XRegExp(`^${getQuotedRegexSource({ lengthQuantifier:"*" })}$`).test(value);
}
