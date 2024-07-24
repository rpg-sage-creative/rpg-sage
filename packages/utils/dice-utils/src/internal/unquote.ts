import XRegExp from "xregexp";

/**
 * @internal
 * Removes quotes from around the value.
 */
export function unquote(value: string): string {
	const quoteRegex = XRegExp(`
		^(
			“[^”]*”
			|
			„[^“]*“
			|
			„[^”]*”
			|
			"[^"]*"
			|
			[“”"][^“”"]*[“”"]
			|
			'[^']*'
			|
			‘[^’]*’
		)$
	`, "xi");
	return quoteRegex.test(value)
		? value.slice(1, -1)
		: value;
}