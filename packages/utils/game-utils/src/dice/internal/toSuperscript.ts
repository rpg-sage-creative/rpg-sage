/** Converts the given number to a string of superscript numbers. Ex: 123 becomes "¹²³" */
export function toSuperscript(value: number): string {
	const period = ".";
	const superPeriod = "\u22C5";
	const superNumbers = ["⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"];
	return String(value)
		.split("")
		.map(char => char === period ? superPeriod : superNumbers[+char])
		.join("");
}