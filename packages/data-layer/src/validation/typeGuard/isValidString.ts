import { isNotBlank } from "@rsc-utils/core-utils";

/** typeof(value) === "string" && isNotBlank(value) */
export function isValidString(value: unknown): value is string {
	return typeof(value) === "string" && isNotBlank(value);
}