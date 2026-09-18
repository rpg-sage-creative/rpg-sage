import { debug, isLogLevelEnabled } from "../console/index.js";
import { splitWrapChars } from "../string/wrap/splitWrapChars.js";
import { escapeRegex } from "./escapeRegex.js";
import type { RegExpAnchorOptions, RegExpCaptureOptions, RegExpFlagOptions, RegExpQuantifyOptions, RegExpSpoilerOptions, RegExpWrapOptions } from "./RegExpOptions.js";

export type RegExpGetOptions = RegExpAnchorOptions & RegExpCaptureOptions & RegExpFlagOptions & RegExpQuantifyOptions & RegExpSpoilerOptions & RegExpWrapOptions;

/**
 * Stores each unique instance to avoid duplicating regex when not needed.
 * The map key is the regex create function name.
 * The map value is an object containing each permutation of the regexp based on options.
 */
const cache: Record<string, Record<string, RegExp>> = {};

/** Creates the unique key for each variant based on options. */
function createCacheKey<T extends RegExpGetOptions>(options: T = {} as T): string {
	const pairs = Object.entries(options).sort(([aKey], [bKey]) => aKey < bKey ? -1 : 1);
	const parts = pairs.map(([key, value]) => `${key}=${value ?? false}`);
	return parts.join("|");
}

type CreateRegexFunction<T extends RegExpGetOptions, U extends RegExp> = (options?: T) => U;

function createRegex<T extends RegExpGetOptions, U extends RegExp>(creator: CreateRegexFunction<T, U>, options?: T): RegExp {
	const { anchored, capture, spoilers, quantifier, wrapChars, wrapOptional } = options ?? {};

	// create the base regexp source
	let { source, flags } = creator(options);

	if (quantifier) {
		source = `(?:${source})${quantifier}`;
	}

	if (spoilers || wrapChars) {
		const { left, right } = splitWrapChars(spoilers ? "||||" : wrapChars!);
		const lPattern = escapeRegex(left);
		const rPattern = escapeRegex(right);

		if (spoilers === "optional" || wrapOptional === true) {
			// create base spoilerized regex
			source = `(?:${lPattern}(?:${source})${rPattern})|(?:${source})`;

		}else {
			source = `${lPattern}(?:${source})${rPattern}`;
		}
	}

	// wrap in a capture group
	if (capture) {
		source = `(?<${capture}>${source})`;
	}

	// wrap to anchor
	if (anchored) {
		source = `^(?:${source})$`;
	}

	return new RegExp(source, flags);
}

/**
 * Returns a cached instance of the given regex if the gFlag is not set.
 * This allows us to cache non-global regex values where we don't need to worry about lastIndex.
 * Because String.replace(RegExp, ...) safely manages the lastIndex of the RegExp, the cacheGlobal param allows us to create and reuse global regexes.
 */
export function getOrCreateRegex<T extends RegExpGetOptions, U extends RegExp>(creator: CreateRegexFunction<T, U>, options?: T, cacheGlobal?: true): RegExp {
	// we check the cache if not using a global regexp
	if (options?.gFlag !== "g" || cacheGlobal) {
		const { name } = creator;
		const cacheItem = cache[name] ?? (cache[name] = {});
		const cacheKey = createCacheKey(options);

		if (isLogLevelEnabled("debug")) {
			const existing = cacheItem[cacheKey];
			if (existing) {
				const updated = createRegex(creator, options);
				if (existing.source !== updated.source || existing.flags !== updated.flags) {
					debug(`regex.cache[${name}][${cacheKey}] differs`);
				}
			}
		}

		return cacheItem[cacheKey] ??= createRegex(creator, options);
	}

	// return a unique regexp
	return createRegex(creator, options);
}
