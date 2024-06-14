import type { RegExpQuantifier } from "./RegExpQuantifier.js";

/** Base options for creating RegExp expressions. */
export type RegExpCreateOptions = {
	/** capture group name if string, unnamed group if true, no group otherwise */
	capture?: boolean | string;

	/** adds global flag to the regex */
	globalFlag?: boolean;

	/** how many to capture */
	quantifier?: RegExpQuantifier;
};