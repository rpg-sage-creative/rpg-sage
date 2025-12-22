import { randomItem } from "@rsc-utils/game-utils";
import type { TDiceOutput } from "../../../../sage-dice/index.js";
import type { SageCommand } from "../../model/SageCommand.js";

const MatchRegExp = /^(?:(\d*)([ usgm]*)#)?(.*?)$/i;
const UniqueRegExp = /u/i;
const SortRegExp = /s/i;
const SecretRegExp = /gm/i;

/** Performs the random item selection and returns the results. */
export function rollRandomItem(_: SageCommand, input: string): TDiceOutput[] {
	const match = MatchRegExp.exec(input) ?? [];
	const count = +match[1] || 1;
	const unique = UniqueRegExp.test(match[2] ?? "");
	const sort = SortRegExp.test(match[2] ?? "");
	const hasSecret = SecretRegExp.test(match[2] ?? "");
	const options = (match[3] ?? "").split(",").map(s => s.trim());
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
	return [{
		hasSecret: hasSecret,
		inlineOutput: selections.join(", "),
		input: input,
		output: `${selections.join(", ")} ${"\u27f5"} ${input}`
	}];
}
