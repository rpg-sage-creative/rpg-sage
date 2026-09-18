import { regex } from "regex";
import type { IncrementArg, Optional, TypedRegExp } from "../index.js";
import { NumberRegExp } from "../number/isNumberString.js";
import { dequote, MisquotedNumberRegExp, QuotedNumberRegExp } from "../string/index.js";
import { Arg } from "./Arg.js";
import { AlphaNumericDashDotArgKeyRegExp } from "./regexp.js";

type IncrementArgMatchGroups = {
	key: string;
	decrement?: "--" | "\u2014";
	increment?: "++";
	operator?: "+=" | "-=";
	value: string;
};

export const IncrementArgRegExp = regex()`
	# word break include ^ | \s; also other characters like brackets []
	\b

	(?<key> ${AlphaNumericDashDotArgKeyRegExp} )

	(
		(?<decrement>
			-{2}

			|

			# MDASH; iOS apparently has an autocorrect feature that converts two dashes to an MDASH
			\u2014
		)

		|

		(?<increment>
			\+{2}
		)

		|

		(?<operator>
			[ \- \+ ] =
		)
		(?<value>
			# quoted
			(?<quotedValue> ${QuotedNumberRegExp} )

			|

			# mismatched
			(?<misquotedValue> ${MisquotedNumberRegExp} )

			|

			# naked
			(?<nakedValue> ${NumberRegExp} )
		)
	)
` as TypedRegExp<IncrementArgMatchGroups>;

// export const IncrementArgRegExpG = globalizeRegex(IncrementArgRegExp);

export function parseIncrementArg<ValueType extends string = string>(raw: Optional<string>, index?: number): IncrementArg<string, ValueType> | undefined;
export function parseIncrementArg<KeyType extends string = string, ValueType extends string = string>(raw: Optional<string>, index?: number): IncrementArg<KeyType, ValueType> | undefined;
export function parseIncrementArg(raw: Optional<string>, index?: number): IncrementArg | undefined {
	if (raw) {
		const match = IncrementArgRegExp.exec(raw);
		if (match?.index === 0 && match[0].length === raw.length) {
			const { key, decrement:opDec, increment:opInc, operator:op, value:val } = match.groups;
			const stringValue = opDec || opInc ? "1" : dequote(val);
			const value = +stringValue;
			// ensure we have a valid number
			if (isNaN(value)) return undefined;

			const operator = (opDec ?? opInc ?? op!)[0]!.replace("\u2014", "-") as "-" | "+";

			return Arg.from({
				index,
				isIncrement: true,
				key,
				operator,
				raw,
				value,
			});
		}
	}
	return undefined;
}