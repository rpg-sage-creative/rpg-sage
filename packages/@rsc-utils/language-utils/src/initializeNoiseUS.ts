import { getNoiseUS } from "./internal/noiseUS.js";
import { readWords } from "./internal/readWords.js";

/**
 * Loads the US noise words used by this repo.
 * By only initializing the data when needed, we can avoid wasted memory when apps don't need it.
 * The number of words added is returned.
 */
export function initializeNoiseUS(filePath?: string): number {
	const noiseUS = getNoiseUS();
	if (noiseUS.size) {
		return 0;
	}

	const words = readWords(filePath, "noiseUS.txt");

	words.forEach(word => noiseUS.add(word));

	return noiseUS.size;
}
