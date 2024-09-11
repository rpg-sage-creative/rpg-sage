import { xRegExp } from "../internal/xRegExp.js";

type Options = {
	/** include a number wrapped in discord spoiler tags, ex: ||1|| */
	allowSpoilers?: boolean;
	/** require the value to be "anchored" to start/end of the string */
	anchored?: boolean;
	/** capture the number, optionally with a capture group */
	capture?: boolean | string;
	/** include the global flag in the regex */
	globalFlag?: boolean;
};

/** A reusable way to get proper regex for a valid +/- integer or decimal. */
export function getNumberRegex(options?: Options): RegExp {
	// default capture: none
	let capture = `?:`;
	if (options?.capture) {
		capture = options.capture === true ? `` : `?<${options.capture}>`;
	}

	const { leftAnchor = "", rightAnchor = "" } = options?.anchored ? { leftAnchor:"^", rightAnchor:"$" } : { };

	const flags = options?.globalFlag ? "xg" : "x";

	const numberRegex = `
		[+-]?         # optional pos/neg sign
		\\d+          # integer portion
		(?:\\.\\d+)?  # optional decimal portion
	`;

	if (options?.allowSpoilers) {
		const spoileredRegex = `\\|\\|${numberRegex}\\|\\|`;
		return xRegExp(`${leftAnchor}(${capture}${numberRegex}|${spoileredRegex})${rightAnchor}`, flags);
	}

	return xRegExp(`${leftAnchor}(${capture}${numberRegex})${rightAnchor}`, flags);
}
