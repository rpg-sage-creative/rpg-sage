/** Convenience method for typeof(value) === "number" || typeof(value) === "bigint" */
export function isNumeric(value: unknown): value is number | bigint {
	const type = typeof(value);
	return type === "number" || type === "bigint";
}
