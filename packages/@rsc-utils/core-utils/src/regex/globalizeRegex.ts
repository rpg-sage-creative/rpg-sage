import type { TypedRegExp } from "@rsc-utils/type-utils";

/**
 * Returns a duplicate of the given RegExp with the "g" flag added (if it was absent).
 * Can be used quickly clone a "g" RegExp when a unique instance is needed to avoid lastIndex issues.
 */
export function globalizeRegex<
	Groups extends Record<Keys, Values>,
	Keys extends string = string,
	Values extends string | undefined = string | undefined
>(regexp: TypedRegExp<Groups, Keys, Values>): TypedRegExp<Groups, Keys, Values>;

export function globalizeRegex<T extends RegExp>(regexp: RegExp): T;

export function globalizeRegex<T extends RegExp>(regexp: RegExp): T {
	return new RegExp(regexp, regexp.flags.replace("g", "") + "g") as T;
}