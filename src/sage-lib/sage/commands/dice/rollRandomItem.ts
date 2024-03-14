import { randomItem } from "@rsc-utils/random-utils";
import type { TDiceOutput } from "../../../../sage-dice";
import type { SageInteraction } from "../../model/SageInteraction";
import type { SageMessage } from "../../model/SageMessage";

type TInteraction = SageMessage | SageInteraction;

export function rollRandomItem(_: TInteraction, input: string): TDiceOutput[] {
	const match = /^(?:(\d*)([ usgm]*)#)?(.*?)$/i.exec(input) ?? [];
	const count = +match[1] || 1;
	const unique = /u/i.test(match[2] ?? "");
	const sort = /s/i.test(match[2] ?? "");
	const hasSecret = /gm/i.test(match[2] ?? "");
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
