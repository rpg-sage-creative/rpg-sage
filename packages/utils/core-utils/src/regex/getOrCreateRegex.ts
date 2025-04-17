import { splitChars } from "../string/index.js";
import { escapeRegex } from "./escapeRegex.js";
import type { RegExpAnchorOptions, RegExpCaptureOptions, RegExpFlagOptions, RegExpQuantifyOptions, RegExpSpoilerOptions, RegExpWrapOptions } from "./RegExpOptions.js";

export type RegExpGetOptions = RegExpAnchorOptions & RegExpCaptureOptions & RegExpFlagOptions & RegExpQuantifyOptions & RegExpSpoilerOptions & RegExpWrapOptions;

/**
 * Stores each unique instance to avoid duplicating regex when not needed.
 * The map key is the regex create function name.
 * The map value is an object containing each permutation of the regexp based on options.
 */
const cache: { [key: string]: { [key: string]: RegExp; }; } = {};

/** Creates the unique key for each variant based on options. */
function createCacheKey<T extends RegExpGetOptions>(options: T = {} as T): string {
	const pairs = Object.entries(options).sort(([aKey], [bKey]) => aKey < bKey ? -1 : 1);
	const parts = pairs.map(([key, value]) => `${key}=${value ?? false}`);
	return parts.join("|");
}

type CreateRegexFunction<T extends RegExpGetOptions, U extends RegExp> = (options?: T) => U;

function createRegex<T extends RegExpGetOptions, U extends RegExp>(creator: CreateRegexFunction<T, U>, options?: T): RegExp {
	const { anchored, capture, spoilers, quantifier, wrapChars, wrapOptional } = options ?? {};

	// create the base regexp
	let regexp = creator(options);

	if (quantifier) {
		regexp = new RegExp(`(?:${regexp.source})${quantifier}`, regexp.flags) as U;
	}

	if (spoilers || wrapChars) {
		const { left, right } = splitChars(spoilers ? "||||" : wrapChars!);
		const lPattern = escapeRegex(left);
		const rPattern = escapeRegex(right);

		regexp = spoilers === "optional" || wrapOptional === true
			? new RegExp(`(?:${lPattern}(?:${regexp.source})${rPattern})|(?:${regexp.source})`, regexp.flags) as U
			: new RegExp(`${lPattern}(?:${regexp.source})${rPattern}`, regexp.flags) as U;
	}

	// wrap in a capture group
	if (capture) {
		regexp = new RegExp(`(?<${capture}>${regexp.source})`, regexp.flags) as U;
	}

	// wrap to anchor
	if (anchored) {
		regexp = new RegExp(`^(?:${regexp.source})$`, regexp.flags) as U;
	}
	return regexp;
}

/**
 * Returns a cached instance of the given regex if the gFlag is not set.
 * This allows us to cache non-global regex values where we don't need to worry about lastIndex.
 */
export function getOrCreateRegex<T extends RegExpGetOptions, U extends RegExp>(creator: CreateRegexFunction<T, U>, options?: T): RegExp {
	// we check the cache if not using a global regexp
	if (options?.gFlag !== "g") {
		const { name } = creator;
		const cacheItem = cache[name] ?? (cache[name] = {});
		const key = createCacheKey(options);
		return cacheItem[key] ?? (cacheItem[key] = createRegex(creator, options));
	}

	// return a unique regexp
	return createRegex(creator, options);
}
