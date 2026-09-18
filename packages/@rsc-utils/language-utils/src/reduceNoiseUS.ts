import { isNoiseUS } from "./internal/noiseUS.js";

/** Removes words considered to be "noise" words. */
export function reduceNoiseUS(terms: string[]): string[];

/** Removes words considered to be "noise" words. */
export function reduceNoiseUS(terms: string[], additionalNoise: string[]): string[];

export function reduceNoiseUS(terms: string[], additionalNoise?: string[]): string[] {
	const filtered = terms.filter(term => !isNoiseUS(term));
	if (additionalNoise) {
		return filtered.filter(word => !additionalNoise.includes(word));
	}
	return filtered;
}