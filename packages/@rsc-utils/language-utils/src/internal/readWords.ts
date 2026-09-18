import { readDataFile } from "./readDataFile.js";

/**
 * @internal
 * For reading word lists, such as noiseUS.
 */
export function readWords(filePath: string | undefined, orFileName: string): string[] {
	const raw = readDataFile(filePath, orFileName);
	if (raw) {
		return raw.split("\n").map(word => word.trim());
	}
	return [];
}