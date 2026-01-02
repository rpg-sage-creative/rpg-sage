import type { Optional } from "@rsc-utils/core-utils";
import { quote } from "./quote.js";

/**
 * Creates a key value string.
 * undefined becomes key="", null becomes key="unset"
 */
export function toKeyValueString(key: string, value: Optional<string | number>): string {
	if (value === null) return `${key}="unset"`;
	if (value === undefined) return `${key}=""`;
	if (typeof(value) === "number") return `${key}="${value}"`;
	return `${key}=${quote(value, "smart")}`;
}