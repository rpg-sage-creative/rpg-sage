export function parseNumeric(value: string): number | bigint {
	// check digit only
	if (/^-?\d+$/.test(value)) {
		if (value.length < 16) return Number(value);
		if (value.length > 16) return BigInt(value);

		const big = BigInt(value);
		if (big > Number.MAX_SAFE_INTEGER) return big;
		if (big < Number.MIN_SAFE_INTEGER) return big;
		return Number(value);
	}

	// check decimals
	if (/^-?\d+(\.\d+)?$/.test(value)) {
		return Number(value);
	}

	return NaN;
}