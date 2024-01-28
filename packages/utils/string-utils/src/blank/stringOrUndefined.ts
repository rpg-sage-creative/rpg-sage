import type { Optional } from "@rsc-utils/type-utils";
import { isBlank } from "./isBlank.js";

/** Returns a non-blank string or undefined. */
export function stringOrUndefined(value: Optional<string>): string | undefined {
	return isBlank(value) ? undefined : value;
}