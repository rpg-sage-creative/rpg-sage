import { readWordPairs } from "./internal/readWordPairs.js";
import { getUKtoUS } from "./internal/ukToUS.js";

/**
 * Loads the uk/us pairs used by this repo.
 * By only initializing the data when needed, we can avoid wasted memory when apps don't need it.
 * The number of pairs added is returned.
 */
export function initializeUKtoUS(filePath?: string): number {
	const ukToUS = getUKtoUS();
	if (ukToUS.size) {
		return 0;
	}

	const pairs = readWordPairs(filePath, "ukToUS.txt");

	pairs.forEach(([uk, us]) => ukToUS.set(uk, us));

	return ukToUS.size;
}
