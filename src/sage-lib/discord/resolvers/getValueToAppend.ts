import type { Optional } from "@rsc-utils/core-utils";

/** @internal Ensures we have a string, prepending a NewLine if needed. */
export function getValueToAppend(value: Optional<string>, newLine: boolean): string {
	return `${newLine ? "\n" : ""}${value ?? ""}`;
}