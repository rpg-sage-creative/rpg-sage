import { regex } from "regex";

/**
 * @internal
 * Removes quotes from around the value.
 */
export function unquote(value: string): string {
	const quoteRegex = regex`
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
	`;
	return quoteRegex.test(value)
		? value.slice(1, -1)
		: value;
}