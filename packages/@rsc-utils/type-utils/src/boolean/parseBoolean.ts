const trueStrings = ["true", "t", "yes", "y", "1"];
const falseStrings = ["false", "f", "no", "n", "0"];

/** Converts known /true/ values (true, 1, "true", "t", "1", "yes", "y") and /false/ values (false, 0, "false", "f", "0", "no", "n") to their boolean equivalent. */
export function parseBoolean(value: unknown): boolean | undefined;

/** Converts known /true/ values ("true", "t", "1", "yes", "y") and /false/ values ("f", "0", "no", "n") to their boolean equivalent. Optionally ignoring case. */
export function parseBoolean(value: string, ignoreCase: boolean): boolean | undefined;

export function parseBoolean(value: unknown, ignoreCase?: boolean): boolean | undefined {
	if (value === true || value === 1 || trueStrings.includes(value as string)) return true;
	if (value === false || value === 0 || falseStrings.includes(value as string)) return false;
	if (ignoreCase === true && typeof(value) === "string") {
		const lower = value.toLowerCase();
		if (trueStrings.includes(lower)) return true;
		if (falseStrings.includes(lower)) return false;
	}
	return undefined;
}