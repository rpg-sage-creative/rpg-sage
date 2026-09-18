import { getOrCreateRegex, globalizeRegex, type RegExpAnchorOptions, type RegExpCaptureOptions, type RegExpFlagOptions } from "@rsc-utils/core-utils";
import { regex } from "regex";
import type { WrapOptions } from "./types.js";

type CreateOptions = RegExpFlagOptions;
type GetOptions = RegExpFlagOptions & RegExpAnchorOptions & RegExpCaptureOptions & WrapOptions;

const IPv4RegExp = regex`
(
	(\g<octet>\.){3}\g<octet>
)

(?(DEFINE)
	(?<octet>
		# 250 - 255
		25[0-5]

		|

		(
			# 20x - 24x
			2[0-4]
			|

			# 1xx
			1\d
			|

			# xx
			[1-9]
			|
		)
		\d # trailing x for the above OR block
	)
)
`;

const IPv6RegExp = regex`
(
	# full address
	(\g<hex>:){7}\g<hex>

	|
	# :: suffix
	(\g<hex>:){1,7}:
	|

	# :: prefix
	:(:\g<hex>){1,7}
	|

	# compressed variations
	(\g<hex>:){1,6}:\g<hex>
	|
	(\g<hex>:){1,5}(:\g<hex>){1,2}
	|
	(\g<hex>:){1,4}(:\g<hex>){1,3}
	|
	(\g<hex>:){1,3}(:\g<hex>){1,4}
	|
	(\g<hex>:){1,2}(:\g<hex>){1,5}
	|
	\g<hex>:(:\g<hex>){1,6}
)

(?(DEFINE)
	(?<hex> [0-9A-Fa-f]{1,4} )
)
`;

export const UrlRegExp = regex("i")`
	# ensure this doesn't start as part of another word
	\b

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
		${IPv4RegExp}

		|
		# ipv6
		${IPv6RegExp}

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

export const UrlRegExpG = globalizeRegex(UrlRegExp);

/** @todo have a serious think about wether or not iFlag is optional on a url ... */
function createUrlRegex(options?: CreateOptions): RegExp {
	return options?.gFlag ? UrlRegExpG : UrlRegExp;
}

/**
 * Returns an instance of the url regexp.
 * If gFlag is passed, a new regexp is created.
 * If gFlag is not passed, a cached version of the regexp is used.
 */
export function getUrlRegex(options?: GetOptions): RegExp {
	return getOrCreateRegex(createUrlRegex, options);
}