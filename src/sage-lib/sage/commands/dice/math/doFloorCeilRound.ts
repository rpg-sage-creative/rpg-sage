import XRegExp from "xregexp";

type Options = { globalFlag?: boolean; };

/** Returns a regular expression that finds: floor(number) or ceil(number) or round(number) */
export function getFloorCeilRoundRegex(options?: Options): RegExp {
	const FLOOR_CEIL_REGEX = XRegExp(`
		(floor|ceil|round)         # function name
		\\(\\s*                    # open parentheses, optional spaces
		(                          # open capture group
			[-+]?\\d+(?:\\.\\d+)?  # +- decimal number
		)                          # close capture group
		\\s*\\)                    # close parentheses, optional spaces
	`, "xi");
	return options?.globalFlag
		? new RegExp(FLOOR_CEIL_REGEX, "gi")
		: FLOOR_CEIL_REGEX;
}

/** Convenience for getFloorCeilRoundRegex().test(value) */
export function hasFloorCeilRound(value: string): boolean {
	return getFloorCeilRoundRegex().test(value);
}

/** Checks the value for floor(number) or ceil(number) or round(number) and replaces it with the result. */
export function doFloorCeilRound(value: string): string {
	const regex = getFloorCeilRoundRegex({ globalFlag:true });
	while (regex.test(value)) {
		value = value.replace(regex, (_, _func: string, _value: string) => {
			// lower case and cast type
			const func = _func.toLowerCase() as "floor" | "ceil" | "round";
			// convert to number
			const value = +_value;
			// do the math
			const result = Math[func](value);
			// return a string
			return String(result);
		});
	}
	return value;
}