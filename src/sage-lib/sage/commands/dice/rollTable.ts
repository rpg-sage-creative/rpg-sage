import { randomInt } from "@rsc-utils/dice-utils";
import { unwrap } from "@rsc-utils/string-utils";
import { type TDiceOutput } from "../../../../sage-dice/index.js";
import { type SageCommand } from "../../model/SageCommand.js";
import { type SimpleRollableTable } from "./SimpleRollableTable.js";
import { fetchTableFromUrl } from "./fetchTableFromUrl.js";

type TableOutput = TDiceOutput & { children?:string[]; };

type _Options = {
	input: string;
	xs?: boolean;
};

function _rollTable(table: SimpleRollableTable, options: _Options): TableOutput | undefined {
	const roll = randomInt(table.min, table.max);
	const item = table.items.find(item => item.min <= roll && roll <= item.max);
	if (item) {
		const result = options.xs ? item.text : `<b>${roll}</b> - ${item.text}`;
		return {
			hasSecret: false,
			inlineOutput: result,
			input: options.input,
			output: result,
			children: item.children
		};
	}
	return undefined;
}

type Options = { times?:number; xs?:boolean; slots?:boolean; };

/**
 * Rolls on the given table.
 * If given a url it fetches the table first.
 */
export async function rollTable(_: SageCommand, input: string, table?: SimpleRollableTable, options?: Options): Promise<TableOutput[]> {

	table = table ?? await fetchTableFromUrl(unwrap(input, "[]"));

	if (!table) return [];

	const results: TableOutput[] = [];

	const xs = options?.xs || options?.slots;
	const opts = { input, xs };

	const times = options?.times ?? 1;
	for (let i = 0; i < times; i++) {
		const result = _rollTable(table, opts);
		if (result) {
			results.push(result);
		}
	}

	if (options?.slots && results.length > 1) {
		return [results.slice(1).reduce((out, result) => {
			out.inlineOutput += result.inlineOutput;
			out.output += result.output;
			return out;
		}, results[0])];
	}

	return results;
}
