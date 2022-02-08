/** Adds commas to the given. Ex: 12345 becomes "12,345" */
export function addCommas(value: number): string {
	if (value < 1000) {
		return String(value);
	}
	const parts: string[] = String(value).split(/\./),
		left: string = parts[0],
		right: string = parts[1] || "",
		array: string[] = Array.from(left) ?? [],
		output: string[] = [];
	let i = 1;
	while (array.length) {
		output.push(array.pop()!);
		if (i === 3 && array.length) {
			i = 1;
			output.push(",");
		}else {
			i++;
		}
	}
	output.reverse();
	return output.join("") + (right ? "." + right : "");
}

/** Adds the appropriate suffix to the given number. Ex: 1 becomes "1st" */
export function nth(number: number) {
	const digit = +String(number).slice(-1);
	if (number !== 11 && digit === 1) {
		return `${number}st`;
	}
	if (number !== 12 && digit === 2) {
		return `${number}nd`;
	}
	if (number !== 13 && digit === 3) {
		return `${number}rd`;
	}
	return `${number}th`;
}

/** Rounds the given number to the given number of decimal places. */
export function round(value: number, decimals: number): number {
	if (isNaN(value) || isNaN(decimals)) {
		return NaN;
	}
	const rounded = Math.round(Number(`${value}e${decimals}`));
	return Number(`${rounded}e-${decimals}`);
}

/*
// export function round_to_precision(x: number, precision: number) {
// 	var y = +x + (precision === undefined ? 0.5 : precision/2);
// 	return y - (y % (precision === undefined ? 1 : +precision));
// }
*/

const SUPERSCRIPT_NUMBERS = ["⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"];
/** Converts the given number to a string of superscript numbers. Ex: 123 becomes "¹²³" */
export function toSuperscript(value: number): string {
	return String(value).split("").map(char => SUPERSCRIPT_NUMBERS[+char]).join("");
}