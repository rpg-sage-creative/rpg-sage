import type { TypedRegExp } from "@rsc-utils/core-utils";
import { randomItem } from "@rsc-utils/game-utils";
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
	const count = +number || 1;
	const hasSecret = prefixLower?.includes("gm") === true;
	const sort = prefixLower?.includes("s");
	const unique = prefixLower?.includes("u");
	const verbose = prefixLower?.includes("v");
	const options = content.split(",").map(s => s.trim());

	const selections: string[] = [];
	const total = (unique ? Math.min(options.length, count) : count);
	do {
		const random = randomItem(options)!;
		if (!unique || !selections.includes(random)) {
			selections.push(random);
		}
	} while (selections.length < total && options.find(option => !selections.includes(option)));

	if (sort) {
		selections.sort();
	}

	const output = `${selections.join(", ")} \u27f5 ${input}`;
	const inlineOutput = verbose ? output : selections.join(", ");

	return [{
		hasSecret,
		inlineOutput,
		input: input,
		output,
	}];
}
