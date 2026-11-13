import { anchorRegExp, globalizeRegExp } from "@rsc-utils/regexp-utils";
import { regex } from "regex";

/*
Future Considerations, Possible Bugs
 - Querystring/path charsets reject legal RFC 3986 sub-delims — ?fields=a,b, ?q=(bold), /a,b all fail
 - Ports require 2–5 digits (:8 fails)
 - Bracketed IPv6 hosts (http://[::1]:8080/x) fail while raw forms pass
*/

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

/** A globalized clone of UrlRegExp. Beware lastIndex when using exec loops against a shared instance. */
export const UrlRegExpG = globalizeRegExp(UrlRegExp);

/** Requires the entire value to be a url. */
export const AnchoredUrlRegExp = anchorRegExp(UrlRegExp);
