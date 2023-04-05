import { isUnique } from "../ArrayUtils";
import { isNotBlank } from "../StringUtils";

/** Removes noise words from the given terms and returns only unique non-blank terms. */
export function reduceNoise(terms: string[], additionalNoise = <string[]>[]): string[] {
	/** The base set of noise words to remove. */
	const NOISE = ["a", "and", "of", "the"];
	const noise = NOISE.concat(additionalNoise);
	const notBlank = terms.filter(isNotBlank);
	const unique = notBlank.filter(isUnique);
	return unique.filter(term => !noise.includes(term));
}
