import { cleanWhitespace } from "@rsc-utils/core-utils";
import { getAon2eUrlRoot } from "./getAon2eUrlRoot.js";
import type { Aon2eGameSystemCode } from "./types.js";

export function createAon2eSearchLink(gameSystem: Aon2eGameSystemCode, searchText: string, label = "Search Archives of Nethys"): string {
	const url = getAon2eUrlRoot(gameSystem) + "search?q=" + cleanWhitespace(searchText, { replacement:"%20" });
	return `<a href="${url}">${label}</a>`;
}