import XRegExp from "xregexp";
import { createUrlRegex, createWhitespaceRegex } from "../../../../sage-utils/utils/StringUtils";

function getHWS() {
	return createWhitespaceRegex({ horizontalOnly:true, quantifier:"*" }).source;
}
export function getDialogTypeOrAliasRegex(): RegExp {
	const HWS = getHWS();
	return XRegExp(`^${HWS}([\\pL\\pN]+)${HWS}::`);
}

export function getDialogNameAndDisplayNameRegex(): RegExp {
	const HWS = getHWS();
	return XRegExp(`^::${HWS}
					((?:[^(](?!::))+) # capture the characters before the "(" that isn't followed by "::"
					\\(([^)]+)\\)     # capture the characters in ()
					${HWS}::`, "x");
}

export function getDialogDisplayNameRegex(): RegExp {
	const HWS = getHWS();
	return XRegExp(`^::${HWS}\\(([^)]+)\\)${HWS}::`);
}

export function getDialogPostTypeRegex(): RegExp {
	const HWS = getHWS();
	return XRegExp(`^::${HWS}(post|embed)${HWS}::`, "i");
}

export function getDialogEmbedColorRegex(): RegExp {
	const HWS = getHWS();
	return XRegExp(`^::${HWS}(?:0x|#)((?:[0-9a-f]{3}){1,2})${HWS}::`, "i");
}

export function getDialogUrlRegex(): RegExp {
	const WS = createWhitespaceRegex({ quantifier:"*" }).source;
	const escaped = createUrlRegex({ wrapped:"<>" }).source;
	const unescaped = createUrlRegex().source;
	return XRegExp(`^::${WS}(${escaped}|${unescaped})${WS}::`, "i");
}

export function getDialogOtherRegex(): RegExp {
	const HWS = getHWS();
	return XRegExp(`^::${HWS}(.*?)${HWS}::`, "i");
}

export type DialogRegexKey = "nameAndDisplayName" | "displayName" | "postType" | "embedColor" | "url" | "other";
type DialogRegexPair = { key:DialogRegexKey; regex:RegExp; };
export function getDialogRegexPairs(): DialogRegexPair[] {
	return [
		{ key:"nameAndDisplayName", regex:getDialogNameAndDisplayNameRegex() },
		{ key:"displayName", regex:getDialogDisplayNameRegex() },
		{ key:"postType", regex:getDialogPostTypeRegex() },
		{ key:"embedColor", regex:getDialogEmbedColorRegex() },
		{ key:"url", regex:getDialogUrlRegex() },
		{ key:"other", regex:getDialogOtherRegex() }
	];
}
