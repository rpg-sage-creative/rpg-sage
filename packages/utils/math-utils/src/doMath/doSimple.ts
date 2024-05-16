
/** Returns a regular expression that finds tests for only numbers and math symbols. */
export function getSimpleRegex(): RegExp {
	return /^[\s\d.^*/+-]+$/;
}

/** Attempts to do the math and returns true if the result was not null. */
export function isSimple(value: string): boolean {
	return doSimple(value) !== null;
}

/**
 * Ensures the value has only mathematical characters before performing an eval to get the math results.
 * Valid math symbols: ^/*+- and spaces and numbers
 */
export function doSimple(value: string): string | null {
	try {
		const equation = value
			// remove spaces
			.replace(/\s/g, "")
			.replace(/\+-/g, "-")
			// add multiplication sign
			.replace(/(\d+)\(([^()]+)\)/g, "$1*($2)")
			// change power symbol
			.replace(/\^/g, "**")
			;
		if (getSimpleRegex().test(equation)) {
			return String(eval(equation));
		}
	} catch (ex) {
		/* ignore */
	}
	return null;
}
