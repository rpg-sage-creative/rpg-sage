
/**
 * @param {string} value
 */
function dequote(value) {
	return /"[^"]*"/.test(value) ? value.slice(1, -1) : value;
}

/**
 * @param {string[]} values
 * @returns {string[]}
 */
export function parseArgs(values) {
	const regex = /^(\w+|("[^"]*"))$/;
	const filtered = values.filter(value => regex.test(value) && !value.startsWith("-"));
	return filtered.map(dequote);
}
