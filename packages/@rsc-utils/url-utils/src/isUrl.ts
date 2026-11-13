import { anchorRegExp, wrapExactRegExp } from "@rsc-utils/regexp-utils";
import { AnchoredUrlRegExp, UrlRegExp } from "./UrlRegExp.js";
import type { VALID_URL, WRAPPED_URL } from "./types.js";

type WrapRequired = { wrapChars:string; wrapOptional?:false; };

type WrapOptional = { wrapChars:string; wrapOptional:true; };

type WrapOptions = { wrapChars:string; wrapOptional?:boolean; };

/** Returns true if the value tests successfully against the url regex */
export function isUrl(value: unknown): value is VALID_URL;

/** Returns true if the value tests successfully against the wrapped url regex */
export function isUrl(value: unknown, options: WrapRequired): value is WRAPPED_URL;

/** Returns true if the value tests successfully against the url regex and allows for the given wrap chars */
export function isUrl(value: unknown, options: WrapOptional): value is VALID_URL | WRAPPED_URL;

/** Same as above, but when wrapOptional has widened to boolean we can only promise it is one or the other */
export function isUrl(value: unknown, options: WrapOptions): value is VALID_URL | WRAPPED_URL;

export function isUrl(value: unknown, options?: WrapOptions): boolean {
	if (typeof(value) !== "string") return false;
	const regex = options?.wrapChars
		? anchorRegExp(wrapExactRegExp(UrlRegExp, options.wrapChars, { optional:options.wrapOptional === true }))
		: AnchoredUrlRegExp;
	return regex.test(value);
}
