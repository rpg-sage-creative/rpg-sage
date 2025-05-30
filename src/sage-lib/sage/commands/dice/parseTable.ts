import { normalizeDashes } from "@rsc-utils/string-utils";
import { unwrap } from "@rsc-utils/core-utils";
import type { SimpleRollableTable, SimpleRollableTableItem } from "./SimpleRollableTable.js";

/** Parse the number cell for min/max. */
function cellToMinMax(cell?: string): [number, number] | undefined {
	const strings = cell?.replace(/[^\d-]/g, "").split("-") ?? [];
	if (strings.length < 1 || strings.length > 2) {
		return undefined;
	}

	const min = +strings[0];
	const max = +(strings[1] ?? min);
	if (isNaN(min) || isNaN(max) || min > max) {
		return undefined;
	}

	return [min, max];
}

/** Parses each line, either by tabs or by simply grabbing the numbers from the front of the line */
function lineToTableItem(line: string): SimpleRollableTableItem | undefined {
	let cells: string[];

	// split on tabs for TSV
	if (line.includes("\t")) {
		cells = line.trim().split(/\t/);

	// use regex to split number(s) from the start of the line
	}else {
		const lineRegex = /^(\d+(?:\s*-\s*\d+)?)\s+(.*?)$/;
		cells = (lineRegex.exec(line.trim()) ?? []).slice(1);
	}

	const text = cells[1]?.trim();
	if (!text) {
		// debug({cell1:cells[1]});
		return undefined;
	}

	const minMax = cellToMinMax(cells[0]);
	if (minMax === undefined) {
		// debug({cell0:cells[0]});
		return undefined;
	}

	// let's cut off the child rolls at 5 ...
	const children = cells.length > 2 ? cells.slice(2, 7).map(s => s?.trim()).filter(s => s) : undefined;

	return { min:minMax[0], max:minMax[1], text, children };
}

/**
 * Parses a table from the given input.
 * Checks TSV and simple lines with numbers at the beginning.
 * Returns undefined if there are any duplicated or missing numbers.
 */
export function parseTable(value?: string | null): SimpleRollableTable | undefined {
	const table: SimpleRollableTable = { min:undefined!, max:undefined!, count:0, items:[] };

	const lines = normalizeDashes(unwrap(value?.trim() ?? "", "[]")).split(/\n/);

	// by definition, a table is multiple lines
	// also, grabbing a one line table of math means simple math no longer works
	if (lines.length === 1) {
		return undefined;
	}

	for (const line of lines) {
		const tableItem = lineToTableItem(line);
		if (!tableItem) {
			// debug({line});
			return undefined;
		}

		table.min = table.min === undefined ? tableItem.min : Math.min(table.min, tableItem.min);
		table.max = table.max === undefined ? tableItem.max : Math.max(table.max, tableItem.max);
		table.count = table.items.push(tableItem);
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