import { escapeRegExp } from "./escapeRegExp.js";
import { splitWrapChars } from "./internal/splitWrapChars.js";

type Options = {
	/** also allow the regexp to match without the wrap chars: `(?:left(?:regexp)right)|(?:regexp)` */
	optional?: boolean;
};

/**
 * Returns a new RegExp wrapped exactly in the given wrap chars, with no added whitespace.
 * Wrap chars are split using splitWrapChars() and escaped for regexp using escapeRegExp().
 * Equivalent to `left(?:source)right`, or, with options.optional, `(?:left(?:source)right)|(?:source)`.
 * Flags match the given RegExp.
 * For a version that allows optional whitespace inside the wrap chars (and supports multiple pairs), see wrapRegExp().
 */
export function wrapExactRegExp(regexp: RegExp, wrapChars: string, options?: Options): RegExp {
	const { left, right } = splitWrapChars(wrapChars);

	const lPattern = escapeRegExp(left);
	const rPattern = escapeRegExp(right);

	const source = options?.optional
		? `(?:${lPattern}(?:${regexp.source})${rPattern})|(?:${regexp.source})`
		: `${lPattern}(?:${regexp.source})${rPattern}`;

	return new RegExp(source, regexp.flags);
}
