import { randomInt } from "@rsc-utils/random-utils";
import { parseTable } from "./parseTable";

export function rollTable(value: string): string | undefined {
	const table = parseTable(value);
	if (table) {
		const roll = randomInt(table.min, table.max);
		const item = table.items.find(item => item.min <= roll && roll <= item.max);
		if (item) {
			return `<b>${roll}</b> - ${item.text}`;
		}
	}
	return undefined;
}