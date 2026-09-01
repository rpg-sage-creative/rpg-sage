import { fetchTableFromUrl } from "./fetchTableFromUrl.js";
import { parseTable } from "./parseTable.js";

/**
 * Tests the given input to see if it is a rollable talbe or a url that returns a rollable table.
 * The input can be wrapped in [] or not.
 */
export async function isValidTable(value?: string): Promise<"table" | "url" | false> {
	if (value) {
		const isValidRawTable = parseTable(value);
		if (isValidRawTable) return "table";

		const isValidTableUrl = await fetchTableFromUrl(value);
		if (isValidTableUrl) return "url";
	}
	return false;
}