/** Convenience method for typeof(value) === "string" */
export function isString(value: any): value is string {
	return typeof(value) === "string";
}
