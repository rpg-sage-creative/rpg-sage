
type Options = { globalFlag?: boolean; };
export function getMinMaxRegex(options?: Options): RegExp {
	const MIN_MAX_REGEX = /(min|max)\(\s*(\d+(?:\s*,\s*\d+)+)\s*\)/i;
	return options?.globalFlag
		? new RegExp(MIN_MAX_REGEX, "gi")
		: MIN_MAX_REGEX;
}

export function hasMinMax(value: string): boolean {
	return getMinMaxRegex().test(value);
}

/** Checks the value for min(left,right) or max(left,right) and replaces it with the result. */
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