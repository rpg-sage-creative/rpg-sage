import XRegExp from "xregexp";
import { getQuotedRegexSource } from "./getQuotedRegexSource.js";
import type { RegExpQuantifier } from "../regex/RegExpQuantifier.js";
import type { RegExpCreateOptions } from "../regex/RegExpCreateOptions.js";

type Options = RegExpCreateOptions & {
	/** Specifies allowed number of characters inside the quotes. */
	lengthQuantifier?: RegExpQuantifier;
};

/**
 * Convenience for creating/sharing quoted value regex.
 * Uses default options: { globalFlag:false, lengthQuantifier:"+" }
 */
export function createQuotedRegex(): RegExp;

/**
 * Convenience for creating/sharing quoted value regex.
 */
export function createQuotedRegex(options: Options): RegExp;

export function createQuotedRegex(options?: Options): RegExp {
	const regex = getQuotedRegexSource(options);
	const quantifier = options?.quantifier ?? "";
	const flags = options?.globalFlag ? "g" : "";
	if (options?.capture) {
		if (options.capture === true) {
			return XRegExp(`(${regex}${quantifier})`, flags);
		}
		return XRegExp(`(?<${options.capture}>${regex}${quantifier})`, flags);
	}
	return XRegExp(regex + quantifier, flags);
}