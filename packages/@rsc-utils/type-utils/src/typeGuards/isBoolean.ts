/** Convenience / TypeGuard method for typeof(value) === "boolean" */
export function isBoolean(value: unknown): value is boolean {
	return typeof(value) === "boolean";
}