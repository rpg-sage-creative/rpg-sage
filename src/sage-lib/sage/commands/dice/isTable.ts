import { parseTable } from "./parseTable";
import { parseTsvTable } from "./parseTsvTable";

export function isTable(value?: string | null): boolean {
	if (value) {
		const table = parseTsvTable(value) ?? parseTable(value);
		return table !== undefined;
	}
	return false;
}