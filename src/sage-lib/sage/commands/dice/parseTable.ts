import { normalizeDashes, unwrap } from "@rsc-utils/string-utils";

type Table = { min:number; max:number; count:number; items:TableItem[]; };
type TableItem = { min:number; max:number; text:string; };

export function parseTable(value: string): Table | undefined {
	const table: Table = { min:undefined!, max:undefined!, count:0, items:[] };

	const lineRegex = /^(\d+)(?:\s*-\s*(\d+))?\s+(.*?)$/;

	const lines = normalizeDashes(unwrap(value, "[]")).replace(/\\n/g, "\n").split(/\n/).map(s => s.trim());
	for (const line of lines) {
		const match = lineRegex.exec(line);
		if (!match) {
			// debug({line});
			return undefined;
		}
		const [_, minString, maxString, text] = match;
		const min = +minString;
		const max = +(maxString ?? minString);
		if (isNaN(min) || isNaN(max) || min > max) {
			// debug({minString,maxString,min,max});
			return undefined;
		}
		table.min = table.min === undefined ? min : Math.min(table.min, min);
		table.max = table.max === undefined ? max : Math.max(table.max, max);
		table.count = table.items.push({ min, max, text });
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