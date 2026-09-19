import { readdirSync } from "node:fs";
import { join } from "node:path";
import { isValidDirectory } from "./isValidDirectory.js";
import { nameSorter } from "./nameSorter.js";

/**
 * Returns all subFolder names that don't start with a period.
 */
export function getSubFolders(path: string) {
	try {
		if (isValidDirectory(path)) {
			const children = readdirSync(path);
			const filtered = children.filter(child => isValidDirectory(join(path, child)));
			filtered.sort(nameSorter);
			return filtered;
		}
	}catch (ex) {
		// ignore
	}
	return [];
}