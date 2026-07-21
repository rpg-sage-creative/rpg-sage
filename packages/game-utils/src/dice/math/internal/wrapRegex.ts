import { escapeRegex, typeError } from "@rsc-utils/core-utils";

type Options = {
	/** make the wrap chars optional: `(regexp)|regex` */
	or?: boolean;
};

/**
 * @deprecated update core-utils and import from there.
 * Wraps the given RegExp in the given left/right pairs.
 * Left/right pairs are split using splitChars() and then escaped for regexp using escapeRegex().
 * Optional spaces are added the inside of the wrap characters.
 * RegExp flags match the given RegExp.
 * The given RegExp is put into a non-capture group to preserve logic, such as | "or".
 * Ex: wrapRegex(/\d+/, ["||||"]) === /\|\|\s*(?:\d+)\s*\|\|/
 * options.or makes each set of wrap pairs optional in the final RegExp.
 * Ex: wrapRegex(/\d+/, ["||||"], { or:true }) === /\|\|\s*(?:\d+)\s*\|\||(?:\d+)/
 */
export function wrapRegex(regexp: RegExp, pairs: string[], options?: Options): RegExp {
	// we don't need to do any work
	if (!pairs.length) {
		return regexp;
	}

	const { flags } = regexp;

	const or = options?.or;

	for (const pair of pairs) {
		const { left, right } = splitWrapChars(pair);

		const original = regexp.source;

		let source =
			// escape the left wrap chars
			escapeRegex(left)
			// add optional space and start non-capture group
			+ "\\s*(?:"
			// add original source
			+ original
			// close non-capture group and add optional space
			+ ")\\s*"
			// escape the right wrap chars
			+ escapeRegex(right);

		// with an "or" we want to allow matching the original regexp
		if (or) {
			source +=
				// add the "or" and start the non-capture group
				"|(?:"
				// add original source
				+ original
				// close non-capture group
				+ ")";
		}

		regexp = new RegExp(source, flags);
	}

	return regexp;
}

type WrapChars = { left:string; right:string; };

/**
 * Splits the chars into left and right, primarily for use when wrapping text in pairs such as (), ||, and the like.
 * If the chars argument is even, then they are split evenly and used as left/right, such as "()" becoming `{ left:"(", right:")" }`.
 * If the chars argument is odd, then they are used as left and then they are reversed and used as right, such as "_*" becoming `{ left:"_*", right:"*_" }`.
 */
function splitWrapChars(chars: string): WrapChars {
	// ensure valid input
	if (!chars?.trim().length) {
		throw typeError({ argKey:"chars", mustBe:"a non-blank string", value:chars });
	}

	//even
	if (chars.length % 2 === 0) {
		const half = chars.length / 2;
		return {
			left: chars.slice(0, half),
			right: chars.slice(half)
		};
	}

	//odd
	return {
		left: chars,
		right: chars.split("").reverse().join("")
	};
}