import { unwrap } from "@rsc-utils/core-utils";
import { randomInt } from "@rsc-utils/dice-utils";
import { type TDiceOutput } from "../../../../sage-dice/index.js";
import { type SageCommand } from "../../model/SageCommand.js";
import { type SimpleRollableTable } from "./SimpleRollableTable.js";
import { fetchTableFromUrl } from "./fetchTableFromUrl.js";

type TableOutput = TDiceOutput & { children?:string[]; };

/**
 * Rolls on the given table.
 * If given a url it fetches the table first.
 */
export async function rollTable(_: SageCommand, input: string, table?: SimpleRollableTable): Promise<TableOutput[]> {
	table = table ?? await fetchTableFromUrl(unwrap(input, "[]"));
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
				children: item.children
			}];
		}
	}
	return [];
}
