/** @internal Converts a number string of the given radix into a bigint. */
export function stringToBigInt(value: string, radix: number): bigint {
	// target radix
	const size = 10;

	// multiplier for each part
	const factor = BigInt(radix ** size);

	// determine how many parts/chunks
	let i = value.length % size || size;

	// the string is broken up into parts small enough to parse as an int
	const parts = [value.slice(0, i)];
	while (i < value.length) {
		parts.push(value.slice(i, i += size));
	}

	return parts.reduce((r, v) =>
		// previous values are multiplied to signify their place in the value
		r * factor
		// each part is parsed as an int from the given radix then converted to bigint and added
		+ BigInt(parseInt(v, radix))
	, 0n);
}