import { unwrap, warnReturnUndefined } from "@rsc-utils/core-utils";
import { getText, isUrl } from "@rsc-utils/io-utils";
import type { SimpleRollableTable } from "./SimpleRollableTable.js";
import { parseTable } from "./parseTable.js";

/**
 * Fetches the content and tries to parse a valid Table from it.
 * Example Table: https://docs.google.com/spreadsheets/d/e/2PACX-1vQWjSJswz85uqy-LvQBbjDgXcIJamuUnO30x3JZzgg09wc3CCbbXFyTIVFj79cdKhNJVS89Gi66XA9T/pub?gid=0&single=true&output=tsv
 */
export async function fetchTableFromUrl(value?: string | null): Promise<SimpleRollableTable | undefined> {
	if (value) {
		const unwrapped = unwrap(value, "[]");
		if (isUrl(unwrapped)) {
			const tsv = await getText(unwrapped).catch(warnReturnUndefined);
			return parseTable(tsv);
		}
	}
	return undefined;
}