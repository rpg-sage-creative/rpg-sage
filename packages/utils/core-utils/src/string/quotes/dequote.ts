import type { RegExpQuantifier } from "../../regex/RegExpOptions.js";
import type { QuoteStyle } from "./getQuotePairs.js";
import { isQuoted } from "./isQuoted.js";

type Options = {
	style?: QuoteStyle;
	contents?: RegExpQuantifier;
};

/**
 * Removes first and last character if they are both quotes.
 * @todo make unescaping quoted characters optional ...
 */
export function dequote(value: string, options?: Options): string {
	if (isQuoted(value, options)) {
		// get the quote chars
		const left = value[0];
		const right = value[value.length - 1];
		const chars = left === right ? left : left + right;
		// remove the quote chars
		value = value.slice(1, -1);
		// unescape quote chars
		value = value.replace(new RegExp(`\\\\([\\\\${chars}])`, "g"), (_, char) => char);
	}
	return value;
}