import type { RegExpQuantifier } from "./RegExpQuantifier.js";

type Options = {
	/** determines if dashes are allowed */
	allowDashes?: boolean;
	/** determines if periods are allowed */
	allowPeriods?: boolean;
	/** how many to capture */
	quantifier?: RegExpQuantifier;
};

/**
 * Returns the string source of our word character regex using XRegExp extensions.
 * Uses default options: { quantifier:"" }
 */
export function getWordCharacterRegexSource(): string;

/**
 * Returns the string source of our word character regex using XRegExp extensions.
 */
export function getWordCharacterRegexSource(options: Options): string;

export function getWordCharacterRegexSource(options?: Options): string {
	const dash = options?.allowDashes ? "\\-" : "";
	const period = options?.allowPeriods ? "\\." : "";
	const quantifier = options?.quantifier ?? "";
	return `[\\w\\pL\\pN${dash}${period}]${quantifier}`;
}