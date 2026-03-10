import { cleanWhitespace } from "@rsc-utils/core-utils";
import { getAon1eUrlRoot } from "./getAon1eUrlRoot.js";
import type { Aon1eGameSystemCode, Aon1eSearchResultsLink } from "./types.js";

export function createAon1eSearchResultUrl(gameSystem: Aon1eGameSystemCode, link: Aon1eSearchResultsLink): string {
	const root = getAon1eUrlRoot(gameSystem);
	const cleanUrl = cleanWhitespace(link.url, { replacement:"%20" }).replace(new RegExp("^" + root, "i"), "");
	return root + cleanUrl;
}