import { isQuotedOrMisquoted } from "./isQuotedOrMisquoted.js";

/**
 * Removes first and last character if the string is a QuotedString or MisquotedString.
 * @todo should unescaping end quotes be optional here?
 */
export function dequote(value: string): string {
	if (isQuotedOrMisquoted(value)) {
		// get the quote chars
		const left = value[0]!;
		const right = value[value.length - 1]!;

		// remove the quote chars
		value = value.slice(1, -1);

		// unescape chars
		value = value.replaceAll(`\\${left}`, left);
		if (left !== right) {
			value = value.replaceAll(`\\${right}`, right);
		}
	}
	return value;
}