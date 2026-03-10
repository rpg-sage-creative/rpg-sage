import { cleanWhitespace } from "@rsc-utils/core-utils";
import { getAon2eUrlRoot } from "./getAon2eUrlRoot.js";
import type { Aon2eGameSystemCode } from "./types.js";

export function createAon2eSearchUrl(gameSystem: Aon2eGameSystemCode, searchText: string): string {
	return getAon2eUrlRoot(gameSystem) + "search?q=" + cleanWhitespace(searchText, { replacement:"%20" });
}