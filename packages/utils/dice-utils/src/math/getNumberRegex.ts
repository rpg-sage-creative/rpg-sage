import { xRegExp } from "../internal/xRegExp.js";

type Options = {
	allowSpoilers?: boolean;
	globalFlag?: boolean;
};

/** A reusable way to get proper regex for a valid +/- integer or decimal. */
export function getNumberRegex(options?: Options): RegExp {
	const flags = options?.globalFlag ? "xg" : "x";
	const numberRegex = `
		[+-]?         # optional pos/neg sign
		\\d+          # integer portion
		(?:\\.\\d+)?  # optional decimal portion
	`;
	if (options?.allowSpoilers) {
		const spoileredRegex = `\\|\\|${numberRegex}\\|\\|`;
		return xRegExp(`(?:${numberRegex}|${spoileredRegex})`, flags);
	}
	return xRegExp(`(?:${numberRegex})`, flags);
}
