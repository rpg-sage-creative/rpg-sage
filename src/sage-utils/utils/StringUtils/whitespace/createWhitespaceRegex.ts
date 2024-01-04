import XRegExp from "xregexp";
import { HORIZONTAL_WHITESPACE_REGEX } from "./consts.js";

type Options = {
	globalFlag?: boolean;
	horizontalOnly?: boolean;
	modifier?: "" | "*" | "+";
};

/**
 * Convenience for creating/sharing whitespace regex in case we change it later.
 * Uses default options: { globalFlag:false, horizontalOnly:false, modifier:"+" }
 */
export function createWhitespaceRegex(): RegExp;

/**
 * Convenience for creating/sharing whitespace regex in case we change it later.
 */
export function createWhitespaceRegex(options: Options): RegExp;

export function createWhitespaceRegex(options?: Options): RegExp {
	const flags = options?.globalFlag ? "g" : "";
	const regex = options?.horizontalOnly ? HORIZONTAL_WHITESPACE_REGEX : "\\s";
	const modifier = options?.modifier ?? "+";
	return XRegExp(regex + modifier, flags);
}
