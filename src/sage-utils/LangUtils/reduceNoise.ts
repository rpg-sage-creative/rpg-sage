import { unique } from "../ArrayUtils";

/** Removes noise words from the given terms and returns only unique terms. */
export function reduceNoise(terms: string[], additionalNoise = <string[]>[]): string[] {
	/** The base set of noise words to remove. */
	const NOISE = ["a", "and", "of", "the"];
	const noise = NOISE.concat(additionalNoise);
	return terms.filter(unique).filter(term => !noise.includes(term));
}
