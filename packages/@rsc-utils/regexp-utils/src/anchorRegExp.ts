import type { TypedRegExp } from "./TypedRegExp.js";

/**
 * Returns a new RegExp that requires the given RegExp to match the entire value.
 * Equivalent to `^(?:source)$`, with the same flags as the given RegExp.
 */
export function anchorRegExp<
	Groups extends Record<Keys, Values>,
	Keys extends string = string,
	Values extends string | undefined = string | undefined
>(regexp: TypedRegExp<Groups, Keys, Values>): TypedRegExp<Groups, Keys, Values>;

export function anchorRegExp<T extends RegExp>(regexp: T): T;

export function anchorRegExp<T extends RegExp>(regexp: T): T {
	return new RegExp(`^(?:${regexp.source})$`, regexp.flags) as T;
}
