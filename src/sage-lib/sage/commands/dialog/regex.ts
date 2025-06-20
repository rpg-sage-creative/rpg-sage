import { getWhitespaceRegex } from "@rsc-utils/core-utils";
import { getUrlRegex } from "@rsc-utils/io-utils";
import { regex } from "regex";

function getHWS({ iFlag }: { iFlag?:"i" } = { }) {
	return getWhitespaceRegex({ iFlag, horizontalOnly:true, quantifier:"*" });
}
export function getDialogTypeOrAliasRegex(): RegExp {
	const HWS = getHWS();
	return regex`^${HWS}(?<alias>[\p{Letter}\p{Number}]+)${HWS}::`;
}

export function getDialogNameAndDisplayNameRegex(): RegExp {
	const HWS = getHWS();
	return regex`^::${HWS}
					(?<dialogName>([^\(](?!::))+)  # capture the characters before the "(" that isn't followed by "::"
					\((?<displayName>[^\)]+)\)     # capture the characters in ()
					${HWS}::`;
}

export function getDialogDisplayNameRegex(): RegExp {
	const HWS = getHWS();
	return regex`^::${HWS}\((?<displayName>[^\)]+)\)${HWS}::`;
}

export function getDialogPostTypeRegex(): RegExp {
	const HWS = getHWS({ iFlag:"i" });
	return regex("i")`^::${HWS}(?<postType>post|embed)${HWS}::`;
}

export function getDialogEmbedColorRegex(): RegExp {
	const HWS = getHWS({ iFlag:"i" });
	return regex("i")`^::${HWS}(0x|\#)(?<color>([0-9a-f]{3}){1,2})${HWS}::`;
}

export function getDialogUrlRegex(): RegExp {
	const WS = getWhitespaceRegex({ iFlag:"i", quantifier:"*" });
	const url = getUrlRegex({ capture:"url", iFlag:"i", wrapChars:"<>", wrapOptional:true });
	return regex("i")`^::${WS}${url}${WS}::`;
}

export function getDialogOtherRegex(): RegExp {
	const HWS = getHWS();
	return regex`^::${HWS}
					(.*?)(?![^\[]*\]|[^\{]*\}) # let's not have brackets [] or braces {}
					${HWS}::`;
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
