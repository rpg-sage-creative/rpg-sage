import type { TypedRegExp } from "@rsc-utils/core-utils";
import { randomItems } from "@rsc-utils/random-utils";
import { regex } from "regex";
import type { TDiceOutput } from "../../../../sage-dice/index.js";
import type { SageCommand } from "../../model/SageCommand.js";

type SecretPrefix = "gm";
type SortPrefix = "s";
type UniquePrefix = "u";
type VerbosePrefix = "v";
type Prefix = `${SecretPrefix|""}${SortPrefix|""}${UniquePrefix|""}${VerbosePrefix|""}`;

type Groups = {
	number?: `${number}`;
	prefix?: Prefix;
	content: string;
};

const MatchRegExp = regex("i")`
	^
	(
		(?<number> \d* )
		(?<prefix>
			(
				\s  # allow spaces
				|
				gm  # gamemaster (aka secret)
				|
				s   # sort
				|
				u   # unique
				|
				v   # verbose
			)*
		)
		\#
	)?
	(?<content> .*? )
	$
` as TypedRegExp<Groups>;

/**
 * Performs the random item selection and returns the results.
 * Input should be unwrapped, as in no [].
 */
export function rollRandomItem(_: SageCommand, input: string): TDiceOutput[] {
	const match = MatchRegExp.exec(input);
	if (!match) return [];

	const { number = 1, prefix, prefixLower = prefix?.toLowerCase(), content } = match.groups;
	const count = +number;
	const hasSecret = prefixLower?.includes("gm") === true;
	const sort = prefixLower?.includes("s");
	const unique = prefixLower?.includes("u");
	const verbose = prefixLower?.includes("v");
	const options = content.split(",").map(s => s.trim());

	const selections = randomItems(options, count, { unique });

	if (sort) {
		selections.sort();
	}

	const results = selections.length ? selections.join(", ") : "Ø"
	const output = `${results} \u27f5 ${input}`;
	const inlineOutput = verbose ? output : selections.join(", ");

	return [{
		hasInvalid: count > 0 && options.length > 0 && !selections.length,
		hasSecret,
		inlineOutput,
		input: input,
		output,
	}];
}
