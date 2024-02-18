/**
 * @param {string} value
 */
function dequote(value) {
	return /"[^"]*"/.test(value) ? value.slice(1, -1) : value;
}

/**
 * @param {string} input
 */
function parsePair(input) {
	const index = input.indexOf("=");
	const key = input.slice(0, index);
	const value = dequote(input.slice(index + 1));
	return { key, value };
}

/**
 * @param {string[]} values
 * @returns {{ [string]:string; }}
 */
export function parsePairs(values) {
	const regex = /^\w+=(\w+|"[^"]*")$/i;
	const filtered = values.filter(value => regex.test(value));
	const pairs = filtered.map(parsePair);
	return pairs.reduce((args, pair) => {
		args[pair.key] = pair.value;
		return args;
	}, {});
}
