import type { TypedRegExp } from "./TypedRegExp.js";

/**
 * Returns a new RegExp that captures the given RegExp into a named capture group.
 * Equivalent to `(?<capture>source)`, with the same flags as the given RegExp.
 */
export function captureRegExp<
	Groups extends Record<Keys, Values>,
	Keys extends string = string,
	Values extends string | undefined = string | undefined
>(regexp: TypedRegExp<Groups, Keys, Values>, capture: string): TypedRegExp<Groups & Record<string, string | undefined>>;

export function captureRegExp<T extends RegExp>(regexp: T, capture: string): RegExp;

export function captureRegExp(regexp: RegExp, capture: string): RegExp {
	return new RegExp(`(?<${capture}>${regexp.source})`, regexp.flags);
}
