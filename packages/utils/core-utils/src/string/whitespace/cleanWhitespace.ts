import { getWhitespaceRegex } from "./getWhitespaceRegex.js";

type Options = {
	/** use HORIZONTAL_WHITESPACE_REGEX if true, \s otherwise */
	horizontalOnly?: boolean;

	/** use replacement instead of " " */
	replacement?: string;
};

/**
 * Reduces adjacent whitespace characters to the options.replacement (default is a single space), then trims the string.
 * If options.horizontalOnly is true, then \n and \r are excluded from the whitespace replaced.
 */
export function cleanWhitespace(value: string, options?: Options): string {
	if (!value) return value;
	const { horizontalOnly, replacement = " " } = options ?? {};
	const regexp = getWhitespaceRegex({ gFlag:"g", quantifier:"+", horizontalOnly });
	return value.replace(regexp, replacement).trim();
}
