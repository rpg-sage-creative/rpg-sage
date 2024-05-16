import XRegExp from "xregexp";

type Options = { globalFlag?: boolean; };

/** Returns a regular expression that finds: min(...number[]) or max(...number[]) */
export function getMinMaxRegex(options?: Options): RegExp {
	const MIN_MAX_REGEX = XRegExp(`
		(min|max)                      # function name
		\\(\\s*                        # open parentheses, optional spaces
		(                              # open capture group
			[-+]?\\d+(?:\\.\\d+)?      # first +- decimal number
			(?:                        # open non-capture group
				\\s*,\\s*              # comma, optional spaces
				[-+]?\\d+(?:\\.\\d+)?  # additional +- decimal number
			)*                         # close non-capture group, allow any number of them
		)                              # close capture group
		\\s*\\)                        # close parentheses, optional spaces
		`, "xi");
	return options?.globalFlag
		? new RegExp(MIN_MAX_REGEX, "gi")
		: MIN_MAX_REGEX;
}

/** Convenience for getMinMaxRegex().test(value) */
export function hasMinMax(value: string): boolean {
	return getMinMaxRegex().test(value);
}

/** Checks the value for min(...number[]) or max(...number[]) and replaces it with the result. */
export function doMinMax(value: string): string {
	const regex = getMinMaxRegex({ globalFlag:true });
	while (regex.test(value)) {
		value = value.replace(regex, (_, _minMax: string, _args: string) => {
			// lower case and cast type
			const minMax = _minMax.toLowerCase() as "min" | "max";
			// split on space,space and convert to numbers
			const args = _args.split(/\s*,\s*/).map(s => +s);
			// do the math
			const result = Math[minMax](...args);
			// return a string
			return String(result);
		});
	}
	return value;
}