import { unquote } from "./unquote.js";

/**
 * @internal
 * Removes quotes from around the value.
 * Removes all backticks (`) from remaining value.
 */
export function unquoteAndDetick(value: string): string {
	return unquote(value).replace(/`/g, "");
}