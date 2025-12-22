import { unwrap } from "@rsc-utils/core-utils";
import { randomInt } from "@rsc-utils/game-utils";
import { type TDiceOutput } from "../../../../sage-dice/index.js";
import { type SageCommand } from "../../model/SageCommand.js";
import { type SimpleRollableTable } from "./SimpleRollableTable.js";
import { fetchTableFromUrl } from "./fetchTableFromUrl.js";

type TableOutput = TDiceOutput & { children?:string[]; };

type _Options = {
	input: string;
	size?: "xxs" | "xs" | "s";
};

function _rollTable(table: SimpleRollableTable, options: _Options): TableOutput | undefined {
	const roll = randomInt(table.min, table.max);
	const item = table.items.find(item => item.min <= roll && roll <= item.max);
	if (item) {
		const result = ["xxs","xs","s"].includes(options.size ?? "") ? item.text : `<b>${roll}</b> - ${item.text}`;
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

type Options = { times?:number; size?:"xxs"|"xs"|"s"; };

/**
 * Rolls on the given table.
 * If given a url it fetches the table first.
 */
export async function rollTable(_: SageCommand, input: string, table?: SimpleRollableTable, options?: Options): Promise<TableOutput[]> {

	table = table ?? await fetchTableFromUrl(unwrap(input, "[]"));

	if (!table) return [];

	const results: TableOutput[] = [];

	const size = options?.size;
	const opts = { input, size };

	const times = options?.times ?? 1;
	for (let i = 0; i < times; i++) {
		const result = _rollTable(table, opts);
		if (result) {
			results.push(result);
		}
	}

	if (results.length > 1) {
		const spacer = options?.size === "xxs" ? "" : options?.size === "xs" ? ", " : undefined;
		if (spacer !== undefined) {
			return [results.slice(1).reduce((out, result) => {
				out.inlineOutput += spacer + result.inlineOutput;
				out.output += spacer + result.output;
				return out;
			}, results[0])];
		}
	}

	return results;
}
