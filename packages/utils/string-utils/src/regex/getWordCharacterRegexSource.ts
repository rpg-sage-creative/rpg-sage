import type { RegExpQuantifier } from "./RegExpQuantifier.js";

type Options = {
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
	const quantifier = options?.quantifier ?? "";
	return `[\\w\\pL\\pN]${quantifier}`;
}