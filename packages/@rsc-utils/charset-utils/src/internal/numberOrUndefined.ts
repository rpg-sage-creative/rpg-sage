
/** Returns the value cast as a number or undefined if the value does not represent a number. */
export function numberOrUndefined(value: unknown): number | undefined {
	switch(typeof(value)) {
		case "number":
			return isFinite(value) ? value : undefined;
		case "string":
			const number = +value;
			return (value.startsWith("+") ? "+" : "") + String(number) ? number : undefined;
		default: return undefined;
	}
}