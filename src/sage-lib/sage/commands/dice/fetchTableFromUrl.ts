import { warnReturnNull } from "@rsc-utils/console-utils";
import { getText, isUrl } from "@rsc-utils/https-utils";
import { parseTable } from "./parseTable.js";
import type { SimpleRollableTable } from "./SimpleRollableTable.js";

/**
 * Fetches the content and tries to parse a valid Table from it.
 * Example Table: https://docs.google.com/spreadsheets/d/e/2PACX-1vQWjSJswz85uqy-LvQBbjDgXcIJamuUnO30x3JZzgg09wc3CCbbXFyTIVFj79cdKhNJVS89Gi66XA9T/pub?gid=0&single=true&output=tsv
 */
export async function fetchTableFromUrl(value?: string | null): Promise<SimpleRollableTable | undefined> {
	if (isUrl(value)) {
		const tsv = await getText(value).catch(warnReturnNull);
		return parseTable(tsv);
	}
	return undefined;
}