import { OptionalHorizontalWhitespaceRegExp as HWS, OptionalWhitespaceRegExp as WS } from "@rsc-utils/core-utils";
import { getUrlRegex } from "@rsc-utils/io-utils";
import { regex } from "regex";

export const DialogTypeOrAliasRegExp = regex`
	^
	${HWS}
	(?<alias>
		[ \w \p{L} \p{N} ]+   # letters, numbers, and underscores only
	)
	${HWS}
	::
`;

const DialogNameAndDisplayNameRegExp = regex`
	^
	::
	${HWS}
	(?<dialogName>
		(
			[^\(]      # capture the characters before the "(" that isn't followed by "::"
			(?!::)
		)+
	)
	\(
	(?<displayName>
		[^\)]+         # capture the characters in ()
	)
	\)
	${HWS}
	::
`;

const DialogDisplayNameRegExp = regex`
	^
	::
	${HWS}
	\(
	(?<displayName>
		[^\)]+
	)
	\)
	${HWS}
	::
`;

const DialogPostTypeRegExp = regex("i")`
	^
	::
	${HWS}
	(?<postType>
		post
		|
		embed
	)
	${HWS}
	::
`;

const DialogEmbedColorRegExp = regex("i")`
	^
	::
	${HWS}
	(0x|\#)
	(?<color>
		( [0-9a-f]{3} ){1,2}
	)
	${HWS}
	::
`;

const DialogUrlRegExp = regex("i")`
	^
	::
	${WS}
	dialog=${getUrlRegex({ capture:"dialogUrl", iFlag:"i", wrapChars:"<>", wrapOptional:true })}
	${WS}
	::
`;

const EmbedUrlRegExp = regex("i")`
	^
	::
	${WS}
	embed=${getUrlRegex({ capture:"embedUrl", iFlag:"i", wrapChars:"<>", wrapOptional:true })}
	${WS}
	::
`;

const UrlRegExp = regex("i")`
	^
	::
	${WS}
	${getUrlRegex({ capture:"url", iFlag:"i", wrapChars:"<>", wrapOptional:true })}
	${WS}
	::
`;

const DialogOtherRegExp = regex`
	^
	::
	${HWS}
	(.*?)
	(?!
		[^\[]*\]    # no []
		|
		[^\{]*\}    # no {}
	)
	${HWS}
	::
`;

export type DialogRegexKey = "nameAndDisplayName" | "displayName" | "postType" | "embedColor" | "url" | "dialogImageUrl" | "embedImageUrl" | "other";
type DialogRegexPair = { key:DialogRegexKey; regex:RegExp; };

const pairs: DialogRegexPair[] = [
	{ key:"nameAndDisplayName", regex:DialogNameAndDisplayNameRegExp },
	{ key:"displayName", regex:DialogDisplayNameRegExp },
	{ key:"postType", regex:DialogPostTypeRegExp },
	{ key:"embedColor", regex:DialogEmbedColorRegExp },
	{ key:"dialogImageUrl", regex:DialogUrlRegExp },
	{ key:"embedImageUrl", regex:EmbedUrlRegExp },
	{ key:"url", regex:UrlRegExp },
	{ key:"other", regex:DialogOtherRegExp }
];

export function getDialogRegexPairs(): DialogRegexPair[] {
	return pairs;
}
