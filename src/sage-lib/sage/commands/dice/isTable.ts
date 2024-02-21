import { parseTable } from "./parseTable";

export function isTable(value?: string | null): boolean {
	return value ? parseTable(value) !== undefined : false;
}