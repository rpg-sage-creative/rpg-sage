/** Convenience method for typeof(value) === "number" */
export function isNumber(value: unknown): value is number {
	return typeof(value) === "number";
}
