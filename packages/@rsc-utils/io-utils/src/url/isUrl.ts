import { getUrlRegex } from "./getUrlRegex.js";
import type { VALID_URL, WRAPPED_URL } from "./types.js";

type WrapOptionsOptionalNever = { wrapChars:string; wrapOptional?:never; };
type WrapOptionsOptionalFalse = { wrapChars:string; wrapOptional:false; };
type WrapOptionsOptionalTrue = { wrapChars:string; wrapOptional:true; };
type WrapOptions = WrapOptionsOptionalNever | WrapOptionsOptionalFalse | WrapOptionsOptionalTrue;

/** Returns true if the value tests successfully against the url regex */
export function isUrl(value: unknown): value is VALID_URL;

/** Returns true if the value tests successfully against the url regex and includes the given wrap chars */
export function isUrl(value: unknown, options: WrapOptionsOptionalNever): value is WRAPPED_URL;

/** Returns true if the value tests successfully against the url regex and includes the given wrap chars */
export function isUrl(value: unknown, options: WrapOptionsOptionalFalse): value is WRAPPED_URL;

/** Returns true if the value tests successfully against the url regex and allows for the given wrap chars */
export function isUrl(value: unknown, options: WrapOptionsOptionalTrue): value is VALID_URL | WRAPPED_URL;

export function isUrl(value: unknown, options?: WrapOptions): boolean {
	return typeof(value) === "string" ? getUrlRegex({ anchored:true, ...options }).test(value) : false;
}
