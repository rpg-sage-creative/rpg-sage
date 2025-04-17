import { getWordCharacterRegex, type RegexWordCharOptions } from "../characters/getWordCharacterRegex.js";
import { escapeRegex } from "../regex/escapeRegex.js";
import { getOrCreateRegex } from "../regex/getOrCreateRegex.js";
import type { RegExpFlagOptions } from "../regex/RegExpOptions.js";
import { getQuotedRegex } from "../string/index.js";

export type RegExpIncrementArgOptions = {
	/** Specifiies a key literal. */
	key?: string;
};

type CreateOptions = RegExpFlagOptions & RegexWordCharOptions & RegExpIncrementArgOptions;

function createIncrementArgRegex(options?: CreateOptions): RegExp {
	const { allowDashes, allowPeriods } = options ?? {};
	const keySource = options?.key ? escapeRegex(options.key) : getWordCharacterRegex({ allowDashes, allowPeriods, quantifier:"+" }).source;
	const modSource = `\\+=|\\-=`;
	const incrementerSource = `\\+{2}|\\-{2}`;
	const quotedSource = getQuotedRegex({ contents:"*" });
	return new RegExp(`(${keySource})(?:(${incrementerSource})|(${modSource})(${quotedSource}|\\S+))`, options?.iFlag);
}

type GetOptions = CreateOptions;

export function getIncrementArgRegex(options?: GetOptions): RegExp {
	return getOrCreateRegex(createIncrementArgRegex, options);
}
