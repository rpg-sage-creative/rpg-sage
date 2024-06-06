/** Shortens sequential +- signs to a single sign. */
export function cleanSigns(value: string): string {
	return value.replace(/[+-](\s*[+-])+/g, match => {
		const signs = match.replace(/\s/g, "");
		let positive = true;
		([...signs]).forEach(sign => positive = sign === "-" ? !positive : positive);
		return positive ? "+" : "-";
	});
}