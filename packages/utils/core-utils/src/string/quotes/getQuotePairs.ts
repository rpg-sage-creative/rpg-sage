/**
 * "any" all double and single quotes, no limitations
 *
 * "double" limits to double quotes
 * "single" limits to single quotes
 *
 * "strict" limits to pure "double" and 'single' quotes
 * "fancy" limits to pure "double" and 'single' and curly “double” and ‘single’ quotes
 * "extended" limits to pure "double" and 'single' and curly “double” and ‘single’ quotes as well as „German“ and „Polish” double quotes
 *
 * "double-strict" limits to pure "double" quotes
 * "double-fancy" limits to pure "double" and curly “double” quotes
 * "double-extended" limits to pure "double" and curly “double” quotes as well as „German“ and „Polish” double quotes
 *
 * "single-strict" limits to pure 'single' quotes
*/
export type QuoteStyle = "any" | "strict" | "fancy" | "extended" | "double" | "double-strict" | "double-fancy" | "double-extended" | "single" | "single-strict";

/** Represents the characters (and their metadata) used in quoting comments, dialog, or string values. */
type QuotePair = {
	/** The two characters that make up the pair of quotes, ex: "" or '' or “” or ‘’ */
	chars: string;

	/** Specifies if this pair is considered single quotes. */
	isSingle: boolean;

	/** Specifies if this pair is considered double quotes. */
	isDouble: boolean;

	/** Specifies if this pair is considered fancy quotes. */
	isFancy: boolean;

	/** Specifies if this pair is valid but not normally used quotes. Ex: „” */
	isExtended: boolean;

	/** Specifies if this pair is valid but uses arrows. Ex: „” */
	isArrow: boolean;
};

type QuotePairs = QuotePair[] & {
	leftChars: string[];
	rightChars: string[]
};

/** Creates and returns an array of quote pairs and their attributes. */
export function getQuotePairs(style?: QuoteStyle): QuotePairs {
	// create pairs
	const pairs = [
		{ chars:`""`, isSingle:false, isDouble:true,  isFancy:false, isExtended:false, isArrow:false },
		{ chars:`“”`,   isSingle:false, isDouble:true,  isFancy:true,  isExtended:false, isArrow:false },

		{ chars:`„“`,    isSingle:false, isDouble:true,  isFancy:false, isExtended:true,  isArrow:false },
		{ chars:`„”`,    isSingle:false, isDouble:true,  isFancy:false, isExtended:true,  isArrow:false },
		{ chars:`«»`,    isSingle:false, isDouble:true,  isFancy:false, isExtended:true,  isArrow:true  },
		{ chars:`»«`,   isSingle:false, isDouble:true,  isFancy:false, isExtended:true,  isArrow:true  },

		{ chars:`''`, isSingle:true,  isDouble:false, isFancy:false, isExtended:false, isArrow:false },
		{ chars:`‘’`,   isSingle:true,  isDouble:false, isFancy:true,  isExtended:false, isArrow:false },
	] as QuotePairs;

	// filter on style
	if (style && style !== "any") {
		return pairs.filter(pair => {
			if (pair.isSingle && style.includes("double")) {
				return false;
			}
			if (pair.isDouble && style.includes("single")) {
				return false;
			}
			if ((pair.isFancy || pair.isExtended || pair.isArrow) && style.includes("strict")) {
				return false;
			}
			if ((pair.isExtended || pair.isArrow) && style.includes("fancy")) {
				return false;
			}
			if (pair.isArrow && style.includes("extended")) {
				return false;
			}
			return true;
		}) as QuotePairs;
	}

	return pairs;
}
