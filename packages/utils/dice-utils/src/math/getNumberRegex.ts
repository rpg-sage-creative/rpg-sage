type Options = {
	/** return the number in a capture group */
	capture?: boolean;
}

/** A reusable way to get proper regex for a valid +/- integer or decimal. */
export function getNumberRegex(options?: Options): RegExp {
	const capture = options?.capture ? "" : "?:";
	return new RegExp(`(${capture}[+-]?\\d+(?:\\.\\d+)?)`);
}
