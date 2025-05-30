import { unwrap, warnReturnUndefined, type Optional } from "@rsc-utils/core-utils";
import { urlOrUndefined } from "@rsc-utils/discord-utils";
import { getText } from "@rsc-utils/io-utils";
import type { SimpleRollableTable } from "./SimpleRollableTable.js";
import { parseTable } from "./parseTable.js";

/**
 * Fetches the content and tries to parse a valid Table from it.
 * Example Table: https://docs.google.com/spreadsheets/d/e/2PACX-1vQWjSJswz85uqy-LvQBbjDgXcIJamuUnO30x3JZzgg09wc3CCbbXFyTIVFj79cdKhNJVS89Gi66XA9T/pub?gid=0&single=true&output=tsv
 */
export async function fetchTableFromUrl(url: Optional<string>): Promise<SimpleRollableTable | undefined> {
	const validUrl = urlOrUndefined(unwrap(url, "[]"));
	if (validUrl) {
		return parseTable(await getText(validUrl).catch(warnReturnUndefined));
	}
	return undefined;
}