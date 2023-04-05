/** Adds commas to the given value. Ex: 12345 becomes "12,345" */
export function addCommas(value: number): string {
	if (value < 1000) {
		return String(value);
	}
	const parts = String(value).split(/\./),
		left = parts[0],
		right = parts[1] ?? "",
		array = Array.from(left) ?? [],
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
