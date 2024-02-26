import { normalizeDashes, unwrap } from "@rsc-utils/string-utils";

type Table = { min:number; max:number; count:number; items:TableItem[]; };
type TableItem = { min:number; max:number; text:string; rolls:string[];  };

export function parseTsvTable(value: string): Table | undefined {
	const table: Table = { min:undefined!, max:undefined!, count:0, items:[] };

	const numberRegex = /^(\d+)(?:\s*-\s*(\d+))?$/;

	const lines = normalizeDashes(unwrap(value, "[]"))
		.replace(/\\n/g, "\n")
		.replace(/\\t/g, "\t")
		.split(/\n/)
		.map(row => row.trim().split(/\t/).map(cell => cell.trim()));
	for (const line of lines) {
		const numbers = numberRegex.exec(line[0] ?? "");
		if (!numbers) {
			// debug({line});
			return undefined;
		}
		const [_, minString, maxString] = numbers;
		const min = +minString;
		const max = +(maxString ?? minString);
		if (isNaN(min) || isNaN(max) || min > max) {
			// debug({minString,maxString,min,max});
			return undefined;
		}
		table.min = table.min === undefined ? min : Math.min(table.min, min);
		table.max = table.max === undefined ? max : Math.max(table.max, max);

		const text = line[1];
		if (!text) {
			// debug({text});
			return undefined;
		}

		const rolls = line.slice(2);
		// debug({rolls});

		table.count = table.items.push({ min, max, text, rolls });
	}

	for (let i = table.min; i <= table.max; i++) {
		const items = table.items.filter(item => item.min <= i && i <= item.max);
		if (items.length !== 1) {
			// debug({i,items});
			return undefined;
		}
	}

	return table;
}