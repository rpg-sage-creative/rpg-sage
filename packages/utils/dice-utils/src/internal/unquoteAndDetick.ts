import { dequote } from "@rsc-utils/core-utils";

/**
 * @internal
 * Removes quotes from around the value.
 * Removes all backticks (`) from remaining value.
 */
export function unquoteAndDetick(value: string): string {
	return dequote(value).replaceAll("`", "");
}