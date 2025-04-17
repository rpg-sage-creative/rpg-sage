import { getOrCreateRegex } from "../../regex/getOrCreateRegex.js";
import type { RegExpAnchorOptions, RegExpCaptureOptions, RegExpFlagOptions, RegExpQuantifier } from "../../regex/RegExpOptions.js";
import { getQuotePairs, type QuoteStyle } from "./getQuotePairs.js";

/** @internal Reusable function for ensuring consistent regex creation. Exported only for testing. */
export function createQuotedRegexPart([left, right]: string, quantifier: RegExpQuantifier): string {
	return `${left}(?:[^${right}\\\\]|\\\\.)${quantifier}${right}`;
}

export type RegExpQuoteOptions = {
	/** Specifies allowed number of characters inside the quotes. */
	contents?: RegExpQuantifier;

	/** Specifies limitations to the style of quotes allowed. */
	style?: QuoteStyle;
};

type CreateOptions = RegExpFlagOptions & RegExpQuoteOptions;

export type QuotedRegexRegExp = RegExp & {
	leftChars: string;
	rightChars: string;
};

/** Creates a new instance of the word character regex based on options. */
function createQuotedRegex(options?: CreateOptions): QuotedRegexRegExp {
	const { gFlag = "", iFlag = "", contents = "+", style = "any" } = options ?? {};
	const flags = gFlag + iFlag;

	const leftChars: string[] = [];
	const rightChars: string[] = [];
	const parts: string[] = [];
	getQuotePairs(style).forEach(pair => {
		leftChars.push(pair.chars[0]);
		rightChars.push(pair.chars[1]);
		parts.push(createQuotedRegexPart(pair.chars, contents));
	});

	const quotedRegex = new RegExp(`(?<!\\\\)(?:${parts.join("|")})`, flags);

	const regexp = quotedRegex as QuotedRegexRegExp;
	regexp.leftChars = leftChars.join("");
	regexp.rightChars = rightChars.join("");
	return regexp;
}

type GetOptions = RegExpFlagOptions & RegExpCaptureOptions & RegExpAnchorOptions & RegExpQuoteOptions;

/**
 * Returns an instance of the quoted regexp.
 * If gFlag is passed, a new regexp is created.
 * If gFlag is not passed, a cached version of the regexp is used.
 * Default options: { anchored:false, capture:undefined, gFlag:"", iFlag:"", contents:"+", style:"any" }
 */
export function getQuotedRegex(options?: GetOptions): QuotedRegexRegExp {
	let leftChars: string | undefined;
	let rightChars: string | undefined;
	const create = (options?: GetOptions) => {
		const regexp = createQuotedRegex(options);
		leftChars = regexp.leftChars;
		rightChars = regexp.rightChars;
		return regexp;
	};
	const regexp = getOrCreateRegex(create, options) as QuotedRegexRegExp;
	if (!regexp.leftChars && leftChars) regexp.leftChars = leftChars;
	if (!regexp.rightChars && rightChars) regexp.rightChars = rightChars!;
	return regexp;
}