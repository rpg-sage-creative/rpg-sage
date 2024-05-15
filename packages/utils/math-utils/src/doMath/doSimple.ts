
export function getSimpleRegex(): RegExp {
	return /^[\s\d.^*/+-]+$/;
}

/** Checks the value against regex to determine if it is a simple math equation. */
export function isSimple(value: string): boolean {
	return getSimpleRegex().test(value);
}

/**
 * Ensures the value has only mathematical characters before performing an eval to get the math results.
 * Valid characters: ()+-/*^ and spaces and numbers
 */
export function doSimple(value: string): string | null {
	try {
		const equation = value
			// remove spaces
			.replace(/\s/g, "")
			// add multiplication sign
			.replace(/(\d+)\(([^()]+)\)/g, "$1*($2)")
			// change power symbol
			.replace(/\^/g, "**")
			;
		if (isSimple(equation)) {
			return String(eval(equation));
		}
	} catch (ex) {
		/* ignore */
	}
	return null;
}
