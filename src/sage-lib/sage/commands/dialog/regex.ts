import XRegExp from "xregexp";
import { createUrlRegex, createWhitespaceRegex } from "@rsc-utils/string-utils";

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

export function getDialogUrlRegex(key?: "dialog" | "embed"): RegExp {
	const WS = createWhitespaceRegex({ quantifier:"*" }).source;
	const url = createUrlRegex({ wrapChars:"<>", wrapOptional:true }).source;
	if (key) {
		return XRegExp(`^::${WS}${key}=(${url})${WS}::`, "i");
	}
	return XRegExp(`^::${WS}(${url})${WS}::`, "i");
}

export function getDialogOtherRegex(): RegExp {
	const HWS = getHWS();
	// return XRegExp(`^::${HWS}(.*?)${HWS}::`, "i");
	return XRegExp(`^::${HWS}
					(.*?)(?![^[]*\\]|[^{]*}) # let's not have brackets [] or braces {}
					${HWS}::`, "x");
}

export type DialogRegexKey = "nameAndDisplayName" | "displayName" | "postType" | "embedColor" | "embedImageUrl" | "dialogImageUrl" | "url" | "other";
type DialogRegexPair = { key:DialogRegexKey; regex:RegExp; };
export function getDialogRegexPairs(): DialogRegexPair[] {
	return [
		{ key:"nameAndDisplayName", regex:getDialogNameAndDisplayNameRegex() },
		{ key:"displayName", regex:getDialogDisplayNameRegex() },
		{ key:"postType", regex:getDialogPostTypeRegex() },
		{ key:"embedColor", regex:getDialogEmbedColorRegex() },
		{ key:"dialogImageUrl", regex:getDialogUrlRegex("dialog") },
		{ key:"embedImageUrl", regex:getDialogUrlRegex("embed") },
		{ key:"url", regex:getDialogUrlRegex() },
		{ key:"other", regex:getDialogOtherRegex() }
	];
}
