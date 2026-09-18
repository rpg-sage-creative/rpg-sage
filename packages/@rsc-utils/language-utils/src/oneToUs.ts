import { ukToUS } from "./internal/ukToUS.js";

/** Convert the word to the US version. */
export function oneToUS(term: string): string {
	return ukToUS(term) ?? term;
}

