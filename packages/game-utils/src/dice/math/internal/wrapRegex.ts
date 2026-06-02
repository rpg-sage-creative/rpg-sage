import { regex } from "regex";

type Options = {
	/** make the wrap chars optional: `(regexp)|regex` */
	or?: boolean;
	/** surround the regex with parens `(regexp)` */
	parens?: boolean;
	/** surround the regex with pipes `||regexp||` */
	pipes?: boolean;
};

/** When using regex, the v/u/x/n flags cannot be given. */
function cleanFlags(flags: string): string {
	return flags
		.replaceAll("v", "")
		.replaceAll("u", "")
		.replaceAll("x", "")
		.replaceAll("n", "");
}

/**
 * Uses regex to wrap a given RegExp in "||||" or "()" or both, optionally making in an "or".
 * Spaces are optional on the inside of the wrap characters.
 */
export function wrapRegex(regexp: RegExp, options: Options = {}): RegExp {
	let flags: string | undefined;

	if (options.pipes) {
		// we only need to get the flags once, the first time we need them
		flags ??= cleanFlags(regexp.flags);

		if (options.or) {
			regexp = regex(flags)` \|\| \s* ${regexp} \s* \|\| | ${regexp} `;

		}else {
			regexp = regex(flags)` \|\| \s* ${regexp} \s* \|\| `;

		}
	}

	if (options.parens) {
		// we only need to get the flags once, the first time we need them
		flags ??= cleanFlags(regexp.flags);

		if (options.or) {
			regexp = regex(flags)` \( \s* ${regexp} \s* \) | ${regexp} `;

		}else {
			regexp = regex(flags)` \( \s* ${regexp} \s* \) `;
		}
	}

	return regexp;
}