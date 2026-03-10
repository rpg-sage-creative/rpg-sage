import { cleanWhitespace } from "@rsc-utils/core-utils";
import { getAon1eUrlRoot } from "./getAon1eUrlRoot.js";
import type { Aon1eGameSystemCode } from "./types.js";

export function createAon1eSearchUrl(gameSystem: Aon1eGameSystemCode, searchText: string): string {
	return getAon1eUrlRoot(gameSystem) + "Search.aspx?Query=" + cleanWhitespace(searchText, { replacement:"%20" });
}