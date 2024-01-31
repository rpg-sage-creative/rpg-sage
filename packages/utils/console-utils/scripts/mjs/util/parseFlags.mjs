/**
 * @param {string[]} values
 * @returns {{ [string]:true; }}
 */
export function parseFlags(values) {
	const filtered = values.filter(arg => arg.startsWith("-"));
	const keys = filtered.map(input => input.slice(1));
	return keys.reduce((flags, key) => {
		flags[key] = true;
		return flags;
	}, {});
}
