import { regex } from "regex";
import { getOrCreateRegex } from "../../regex/getOrCreateRegex.js";
import type { RegExpAnchorOptions, RegExpCaptureOptions, RegExpFlagOptions } from "../../regex/RegExpOptions.js";

type WrapOptions = {
	/** expects the two characters used to wrap the url, ex: <> for discord */
	wrapChars?: string;

	/** determines if the .wrapped value is optional or not */
	wrapOptional?: boolean;
};

type CreateOptions = RegExpFlagOptions;
type GetOptions = RegExpFlagOptions & RegExpAnchorOptions & RegExpCaptureOptions & WrapOptions;

function createUrlRegex(options?: CreateOptions): RegExp {
	const { gFlag = "", iFlag = "" } = options ?? {};
	const flags = gFlag + iFlag;

	return regex(flags)`
		# protocol
		(s?ftp|https?)://

		# auth
		(\S+(:\S*)?@)?

		# hostname
		(
			# first sub can have - or underscore, but cannot end in one
			(([0-9a-z\u00a1-\uffff][\-_]*)*[0-9a-z\u00a1-\uffff]+\.)

			# domain can have dashes, but cannot end in one
			(([0-9a-z\u00a1-\uffff]-*)*[0-9a-z\u00a1-\uffff]+\.)*

			# alpha only tld
			([a-z\u00a1-\uffff]{2,})

			|
			# ipv4
			(\d{1,3}\.){3}\d{1,3}

			|
			localhost
		)

		# port
		(:\d{2,5})?

		# path
		(/[%.~+\-\w]*)*

		# querystring
		(\?[;&=%.~+\-\w]*)?

		# anchor
		(\#[\-\w]*)?
	`;
}

/**
 * Returns an instance of the number regexp.
 * If gFlag is passed, a new regexp is created.
 * If gFlag is not passed, a cached version of the regexp is used.
 */
export function getUrlRegex(options?: GetOptions): RegExp {
	return getOrCreateRegex(createUrlRegex, options);
}