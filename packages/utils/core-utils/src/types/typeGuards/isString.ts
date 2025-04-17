/** Convenience / TypeGuard method for typeof(value) === "string" */
export function isString(value: unknown): value is string {
	return typeof(value) === "string";
}
