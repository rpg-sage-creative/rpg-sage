
/**
 * Puts quotes around a value.
 * If the quotes used are in the value, they are escaped.
 * Default style: "double"
 */
export function quote(value: string, style?: "single" | "double"): string {
	const char = style === "single" ? `'` : `"`;
	const regexp = new RegExp(`[\\\\${char}]`, "g");
	const escaped = value.replace(regexp, `\\$&`);
	return char + escaped + char;
}