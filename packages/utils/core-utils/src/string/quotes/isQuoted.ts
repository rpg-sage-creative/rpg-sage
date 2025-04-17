import type { RegExpQuantifier } from "../../regex/RegExpOptions.js";
import type { Optional } from "../../types/generics.js";
import { getQuotedRegex } from "./getQuotedRegex.js";
import type { QuoteStyle } from "./getQuotePairs.js";

type Options = {
	style?: QuoteStyle;
	contents?: RegExpQuantifier;
};

/** Returns true if the value is properly quoted, false otherwise. */
export function isQuoted(value: Optional<string>, options?: Options): boolean {
	return value ? getQuotedRegex({ anchored:true, ...options }).test(value) : false;
}
