/** Puts quotes around a value; if the value has quotes in it, it will try various fancy quotes until it won't break. */
export function quote(value: string): string {
	if (value.includes(`"`)) {
		//“[^”]${s}”|„[^“]${s}“|„[^”]${s}”|"[^"]${s}"
		if (!/[“”]/.test(value)) {
			return `“${value}”`;
		}
		if (!/[„“]/.test(value)) {
			return `„${value}“`;
		}
		if (!/[„”]/.test(value)) {
			return `„${value}”`;
		}
	}
	return `"${value}"`;
}