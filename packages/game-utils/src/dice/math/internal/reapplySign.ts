function parse(value: string) {
	// trim start and capture padding
	const startTrimmed = value.trimStart();
	const startPad = value.slice(0, value.length - startTrimmed.length);

	// trim end and capture padding
	const trimmed = value.trimEnd();
	const endPad = value.slice(trimmed.length);

	const prefix = trimmed[0];
	const minus = prefix === "-";
	const plus = prefix === "+";
	const signed = plus || minus;

	const wrapped = trimmed.startsWith("(") && trimmed.endsWith(")");

	return { endPad, plus, signed, startPad, trimmed, wrapped };
}

/**
 * Determines if the input had a leading +/- sign that would indicate the output should also have a leading +/- sign.
 * Also preserves start/end whitespace to try to keep formatting consistent/reliable.
 */
export function reapplySign(pre: string, post: string): string {
	const { endPad, signed:preSigned, startPad, wrapped:preWrapped } = parse(pre);
	const { plus:postPlus, signed:postSigned, trimmed } = parse(post);

	// if we were given "(x+y)" and got "+z" we should drop the "+" to avoid adding excess math
	if (preWrapped && postPlus) {
		// replace only the first "+"
		return startPad
			+ trimmed.replace("+", "")
			+ endPad;
	}

	// otherwise, if the input had a sign, our output should have a sign
	if (preSigned && !postSigned) {
		// add the "+"
		return startPad
			+ "+"
			+ trimmed
			+ endPad;
	}

	// no changes
	return startPad
		+ trimmed
		+ endPad;
}