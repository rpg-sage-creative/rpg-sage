import type { TypedRegExp } from "./TypedRegExp.js";

/**
 * Returns a duplicate of the given RegExp with the "g" flag added (if it was absent).
 * Can be used quickly clone a "g" RegExp when a unique instance is needed to avoid lastIndex issues.
 */
export function globalizeRegExp<
	Groups extends Record<Keys, Values>,
	Keys extends string = string,
	Values extends string | undefined = string | undefined
>(regexp: TypedRegExp<Groups, Keys, Values>): TypedRegExp<Groups, Keys, Values>;

export function globalizeRegExp<T extends RegExp>(regexp: RegExp): T;

export function globalizeRegExp<T extends RegExp>(regexp: RegExp): T {
	return new RegExp(regexp, regexp.flags.replace("g", "") + "g") as T;
}