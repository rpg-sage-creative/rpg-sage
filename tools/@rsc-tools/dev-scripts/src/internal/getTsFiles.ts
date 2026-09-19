import { readdirSync } from "node:fs";
import { join } from "node:path";
import { isValidDirectory } from "./isValidDirectory.js";
import { isValidFile } from "./isValidFile.js";
import { nameSorter } from "./nameSorter.js";

/**
 * Returns all fileNames names that end in .ts
 */
export function getTsFiles(path: string) {
	try {
		if (isValidDirectory(path)) {
			const children = readdirSync(path);
			const filtered = children.filter(child => isValidFile(join(path, child)));
			filtered.sort(nameSorter);
			return filtered;
		}
	}catch (ex) {
		// ignore
	}
	return [];
}