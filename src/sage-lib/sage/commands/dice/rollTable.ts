import { randomInt } from "@rsc-utils/random-utils";
import type { TDiceOutput } from "../../../../sage-dice";
import type { SageInteraction } from "../../model/SageInteraction";
import type { SageMessage } from "../../model/SageMessage";
import { parseTable } from "./parseTable";
import { parseTsvTable } from "./parseTsvTable";

type TInteraction = SageMessage | SageInteraction;
type TableOutput = TDiceOutput & { itemText?:string; itemRolls?:string[]; };

export function rollTable(_: TInteraction, input: string): TableOutput[] {
	const table = parseTsvTable(input) ?? parseTable(input);
	if (table) {
		const roll = randomInt(table.min, table.max);
		const item = table.items.find(item => item.min <= roll && roll <= item.max);
		if (item) {
			const result = `<b>${roll}</b> - ${item.text}`;
			return [{
				hasSecret: false,
				inlineOutput: result,
				input: input,
				output: result,
				itemRolls: item.rolls
			}];
		}
	}
	return [];
}
