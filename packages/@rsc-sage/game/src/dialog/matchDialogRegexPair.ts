import { captureRegExp, wrapExactRegExp } from "@rsc-utils/regexp-utils";
import { UrlRegExp as HttpUrlRegExp } from "@rsc-utils/url-utils";
import { OptionalHorizontalWhitespaceRegExp as HWS, OptionalWhitespaceRegExp as WS } from "@rsc-utils/whitespace-string-utils";
import { regex } from "regex";

/** A url with optional <> wrap chars. */
const WrappedUrlRegExp = wrapExactRegExp(HttpUrlRegExp, "<>", { optional:true });

/** captures :: character name (display name) :: */
const DialogNameAndDisplayNameRegExp = regex`
	^
	::
	${HWS}
	(?<dialogName>
		(
			[^ \( ]    # capture the characters before the "(" that isn't followed by "::"
			(?! :: )
		)+
	)
	\(
	(?<displayName>
		[^ \) ]+       # capture the characters in ()
	)
	\)
	${HWS}
	::
`;

/** captures :: (display name) :: */
const DialogDisplayNameRegExp = regex`
	^
	::
	${HWS}
	\(
	(?<displayName>
		[^ \) ]+
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
	(?<color>
		(0x|\#)
		( [0-9a-f]{3,4} ){1,2}
	)
	${HWS}
	::
`;

const DialogUrlRegExp = regex("i")`
	^
	::
	${WS}
	dialog
	${HWS}
	=
	${HWS}
	${captureRegExp(WrappedUrlRegExp, "dialogUrl")}
	${WS}
	::
`;

const EmbedUrlRegExp = regex("i")`
	^
	::
	${WS}
	embed
	${HWS}
	=
	${HWS}
	${captureRegExp(WrappedUrlRegExp, "embedUrl")}
	${WS}
	::
`;

const UrlRegExp = regex("i")`
	^
	::
	${WS}
	${captureRegExp(WrappedUrlRegExp, "url")}
	${WS}
	::
`;

const DialogOtherRegExp = regex`
	^
	::
	${HWS}
	(?<content> .*? )
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
] as const;

export type DialogRegExpMatch = {
	/** which regex pair */
	key: DialogRegexKey;
	/** the full match */
	value: string | undefined;
	/** the indexed match groups */
	values: string[];
	/** the length to slice to remove the matched pair */
	sliceLength: number;
};

export function matchDialogRegexPair(value: string): DialogRegExpMatch | undefined {
	for (const pair of pairs) {
		const match = pair.regex.exec(value);
		if (match) {
			const key = pair.key as DialogRegexKey;
			const value = match[1];
			const values = match.slice(1);
			// .length - 2 to leave :: at the beginning of the string
			const sliceLength = match[0].length - 2;
			return { key, value, values, sliceLength };
		}
	}
	return undefined;
}