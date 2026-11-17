/** Convenience method for: typeof(value) === "number" && Number.isFinite(value) */
export function isFiniteNumber(value: unknown): value is number {
	return typeof(value) === "number" && Number.isFinite(value);
}
