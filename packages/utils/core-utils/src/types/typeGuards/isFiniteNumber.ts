/** Convenience method for: typeof(value) === "number" && isFinite(value) */
export function isFiniteNumber(value: unknown): value is number {
	return typeof(value) === "number" && isFinite(value);
}
