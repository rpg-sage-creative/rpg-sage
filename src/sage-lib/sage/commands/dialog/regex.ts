import * as _XRegExp from "xregexp";
import { createUrlRegex, createWhitespaceRegex } from "../../../../sage-utils/utils/StringUtils";
const XRegExp: typeof _XRegExp = (_XRegExp as any).default;

function getWhitespaceRegex(): string {
	return createWhitespaceRegex({ horizontalOnly:false, modifier:"*" }).source;
}

export function getDialogTypeOrAliasRegex(): RegExp {
	const HWS = getWhitespaceRegex();
	return XRegExp(`^${HWS}([\\pL\\pN]+)${HWS}::`);
}

export function getDialogNameAndDisplayNameRegex(): RegExp {
	const HWS = getWhitespaceRegex();
	return XRegExp(`^::${HWS}
					((?:[^(](?!::))+) # capture the characters before the "(" that isn't followed by "::"
					\\(([^)]+)\\)     # capture the characters in ()
					${HWS}::`, "x");
}

export function getDialogDisplayNameRegex(): RegExp {
	const HWS = getWhitespaceRegex();
	return XRegExp(`^::${HWS}\\(([^)]+)\\)${HWS}::`);
}

export function getDialogPostTypeRegex(): RegExp {
	const HWS = getWhitespaceRegex();
	return XRegExp(`^::${HWS}(post|embed)${HWS}::`, "i");
}

export function getDialogEmbedColorRegex(): RegExp {
	const HWS = getWhitespaceRegex();
	return XRegExp(`^::${HWS}(?:0x|#)((?:[0-9a-f]{3}){1,2})${HWS}::`, "i");
}

export function getDialogUrlRegex(): RegExp {
	const HWS = getWhitespaceRegex();
	const escaped = createUrlRegex({ escaped:true }).source;
	const unescaped = createUrlRegex({ escaped:false }).source;
	return XRegExp(`^::${HWS}(${escaped}|${unescaped})${HWS}::`, "i");
}

export function getDialogOtherRegex(): RegExp {
	const HWS = getWhitespaceRegex();
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
