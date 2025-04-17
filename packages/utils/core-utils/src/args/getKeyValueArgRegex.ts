import { pattern, regex } from "regex";
import { getWordCharacterRegex, type RegexWordCharOptions } from "../characters/getWordCharacterRegex.js";
import { escapeRegex } from "../regex/escapeRegex.js";
import { getOrCreateRegex } from "../regex/getOrCreateRegex.js";
import type { RegExpAnchorOptions, RegExpCaptureOptions, RegExpFlagOptions } from "../regex/RegExpOptions.js";
import { getQuotedRegex, type QuotedRegexRegExp, type RegExpQuoteOptions } from "../string/index.js";

/**
 * strict:  spaces around the pair: required, quotes: required
 * default: spaces around the pair: required, quotes: optional
 * sloppy:  spaces around the pair: optional, quotes: optional
 */
export type KeyValueArgMode = "default" | "strict" | "sloppy";

export type RegExpKeyValueArgOptions = {
	/** Specifiies a key literal. */
	key?: string;

	/** Specifies if quotes are required or if we can allow spaces around the equals (=) sign. */
	mode?: KeyValueArgMode;
};

type CreateOptions = RegExpFlagOptions & RegexWordCharOptions & RegExpQuoteOptions & RegExpKeyValueArgOptions;

type RegExpByModeOptions = {
	flags?: `${"g"|""}${"i"|""}${"u"|""}`;
	keyRegex: RegExp;
	mode?: KeyValueArgMode;
	quotedRegex: QuotedRegexRegExp;
};

function createStrictRegex({ flags, keyRegex, quotedRegex }: RegExpByModeOptions): RegExp {
	return new RegExp(`(?<=(?:^|\\s))(?:${keyRegex.source})=(?:${quotedRegex.source})(?=(?:\\s|$))`, flags + "u");
	// return regex(flags)`
	// 	(?<=(^|\s))     # start of line or whitespace
	// 	${keyRegex}
	// 	=
	// 	${quotedRegex}
	// 	(?=(\s|$))      # whitespace or end of line
	// `;
}

function createDefaultRegex({ flags, keyRegex, quotedRegex }: RegExpByModeOptions): RegExp {
	const nakedRegex = pattern`[^\s\n\r${quotedRegex.leftChars}]\S*`;
	return regex(flags)`
		(?<=(^|\s))        # start of line or whitespace
		${keyRegex}
		=
		(
			${quotedRegex}
			|
			${nakedRegex}  # unquoted value that doesn't start with left quote and has no spaces
		)
		(?=(\s|$))         # whitespace or end of line
	`;
}

function createSloppyRegex({ flags, keyRegex, quotedRegex }: RegExpByModeOptions): RegExp {
	const startBoundary = pattern`^|[\s${quotedRegex.rightChars}]`;
	const nakedRegex = pattern`[^\s\n\r${quotedRegex.leftChars}]\S*`;
	return regex(flags)`
		(?<=${startBoundary})                # start of line or whitespace or a right quote
		${keyRegex}
		(
			\s*=\s*${quotedRegex}  # allow spaces around = only if the value is quoted; also captures the only quoted ("strict") values
			|
			=${nakedRegex}         # allow an unquoted no-space value as long as it doesn't start with a left quote
			(?=(\s|$))             # whitespace or end of line
		)
	`;
}

function getRegexByMode(options: RegExpByModeOptions): RegExp {
	switch(options.mode) {
		case "sloppy": return createSloppyRegex(options);
		case "strict": return createStrictRegex(options);
		default: return createDefaultRegex(options);
	}
}

/** Creates a new instance of the KeyValueArg regex based on options. */
function createKeyValueArgRegex(options?: CreateOptions): RegExp {
	const { allowDashes, allowPeriods, gFlag = "", iFlag = "i", key, contents = "*", style = "any" } = options ?? {};
	const mode = style !== "any" ? "strict" : options?.mode;
	const flags = gFlag + iFlag as "gi";

	let keyRegex: RegExp;
	if (key) {
		const tester = getWordCharacterRegex({ iFlag, quantifier:"+", allowDashes:true, allowPeriods:true });
		if (tester.exec(key)?.[0] !== key) {
			throw new RangeError(`Invalid keyValueArg key`);
		}
		keyRegex = new RegExp(escapeRegex(key), iFlag + "u");
	}else {
		keyRegex = getWordCharacterRegex({ iFlag, quantifier:"+", allowDashes, allowPeriods });
	}

	const quotedRegex = getQuotedRegex({ iFlag, contents, style });
	const keyValueArgRegex = getRegexByMode({ flags, keyRegex, mode, quotedRegex });
	return keyValueArgRegex;
}

type GetOptions = CreateOptions & RegExpAnchorOptions & RegExpCaptureOptions;

/**
 * Returns an instance of the KeyValueArg regexp.
 * If gFlag is passed, a new regexp is created.
 * If gFlag is not passed, a cached version of the regexp is used.
 * Default options: { allowDashes:false, allowPeriods:false, contents:"*", iFlag:"i", mode:"default", style:"any" }
 * Setting style to anything other than "any" forces mode to "strict".
 */
export function getKeyValueArgRegex(options?: GetOptions): RegExp {
	return getOrCreateRegex(createKeyValueArgRegex, options);
}
