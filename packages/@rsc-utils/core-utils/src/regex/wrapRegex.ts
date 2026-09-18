import { splitWrapChars } from "../string/wrap/splitWrapChars.js";
import { escapeRegex } from "./escapeRegex.js";

type Options = {
	/** make the wrap chars optional: `(regexp)|regex` */
	or?: boolean;
};

/**
 * Wraps the given RegExp in the given left/right pairs.
 * Left/right pairs are split using splitWrapChars() and then escaped for regexp using escapeRegex().
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