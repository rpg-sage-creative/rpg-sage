import { oneToUS } from "./oneToUs.js";

/** Convert each word in the array to the US version. */
export function allToUS(terms: string[]): string[] {
	return terms.map(oneToUS);
}

