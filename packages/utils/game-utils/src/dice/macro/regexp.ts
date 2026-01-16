import { OptionalHorizontalWhitespaceRegExp as HWS, AlphaNumericDashDotArgKeyRegExp as KEY, type TypedRegExp } from "@rsc-utils/core-utils";
import { regex } from "regex";

type DiceMacroArgPlaceholderRegExpGroups = { vs?:string; key:string; defaultValue?:string; };

/**
 * The ac/dc/vs prefix is captured to improve output when dealing with ac/dc/vs tests in macros.
 * @todo determine if we want to expand the ac/dc/vs offerings or perhaps create variations of this regexp per game system?
 */
export const DiceMacroArgPlaceholderRegExp = regex("i")`
	# optional ac/dc/vs prefix
	(?<vs>
		# ensure we aren't grabbing the end of a word
		\b

		# this is geared toward base/d20 games
		( ac | dc | vs )

		# capture spaces here maintain spacing
		\g<space>
	)?

	\{  # open brace

		# optional space
		\g<space>

		# required key
		(?<key> ${KEY} )

		# optional space
		\g<space>

		# optional default value
		(
			# single colon only; two colons are used as char stat references
			:(?!:)

			# optional space
			\g<space>

			# capture everything before the closing brace
			(?<defaultValue> [^\}]* )

			# optional space
			\g<space>

		)?

	\}  # close brace


	(?(DEFINE)
		(?<space> ${HWS} )
	)
` as TypedRegExp<DiceMacroArgPlaceholderRegExpGroups>;

export const DiceMacroArgPlaceholderRegExpG = new RegExp(DiceMacroArgPlaceholderRegExp, "g") as TypedRegExp<DiceMacroArgPlaceholderRegExpGroups>;

export function hasDiceMacroArgPlaceholder(value?: string): boolean {
	return value ? DiceMacroArgPlaceholderRegExp.test(value) : false;
}

export const DiceMacroRemainingArgPlaceholderRegExpG = regex("g")`
	\{  # open brace

		\g<space>  # optional horizontal whitespace

		# non-capture group for "or" clause
		(
			\.{3}  # three periods
			|
			…      # ellipses character
		)

		\g<space>  # optional horizontal whitespace

	\}  # close brace


	(?(DEFINE)
		(?<space> ${HWS} )
	)
`;

export function hasDiceMacroRemainingArgPlaceholder(value?: string): boolean {
	return value ? value.includes("{...}") || value.includes("{…}") : false;
}
