import { regex } from "regex";

/** A single reusable regexp for letters and numbers beyond \w; [ \w \p{L} \p{N} ] */
export const AlphaNumericRegExp = regex()`[ \w \p{L} \p{N} ]`;

/** A single reusable regexp for letters and numbers dashes and dots beyond \w, \-, \.; [ \w \p{L} \p{N} \- \. ] */
export const AlphaNumericDashDotRegExp = regex()`[ \w \p{L} \p{N} \- \. ]`;

/** Ensures that the key starts and ends with alpha numeric values while allowing dashes and dots within. */
export const AlphaNumericDashDotArgKeyRegExp = regex()`
	\g<alphaNumeric>                    # letters and numbers only (a leading dash is a FlagArg)
	(
		\g<alphaNumericDashDot>*        # letters, numbers, dashes, and periods
		\g<alphaNumeric>                # letters and numbers only (a traling dash is a IncrementArg)
	)?


	(?(DEFINE)
		(?<alphaNumeric> ${AlphaNumericRegExp} )
		(?<alphaNumericDashDot> ${AlphaNumericDashDotRegExp} )
	)
`;