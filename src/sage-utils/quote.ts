/**
 * Puts quotes around a value.
 * If style is "smart", then the quotes used change depending on quotes found in the value: first "", then “”, then '', finally ‘’.
 * If style is "double" or "single" and the quotes used are in the value, they are escaped.
 * Default style: "double"
 */
export function quote(value: string, style: "double" | "single" | "smart" = "double"): string {
	if (style === "smart" && value.includes('"')) {
		// fancy double
		if (!value.includes('“') && !value.includes('”')) {
			return `“${value}”`; // “”
		}

		// single
		if (!value.includes("'")) {
			return `'${value}'`; // ''
		}

		// fancy single
		if (!value.includes("‘") && !value.includes("’")) {
			return `‘${value}’`; // ‘’
		}
	}

	const char = style === "single" ? `'` : `"`;
	const escaped = value.replaceAll(char, `\\${char}`);
	return char + escaped + char;
}