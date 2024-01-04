import { createUrlRegex } from "./createUrlRegex.js";

/** Returns the url if valid, removing <> characters if it was escaped. */
export function parseUrl(value: string): string | null {
	const baseRegex = createUrlRegex({ anchored:true });
	if (baseRegex.test(value)) {
		return value;
	}

	const escapedRegex = createUrlRegex({ anchored:true, escaped:true });
	if (escapedRegex.test(value)) {
		return value.slice(1, -1);
	}

	return null;
}