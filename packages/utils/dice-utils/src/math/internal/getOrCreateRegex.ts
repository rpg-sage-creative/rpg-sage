import type { RegExpAnchorOptions, RegExpCaptureOptions, RegExpFlagOptions, RegExpQuantifyOptions, RegExpSpoilerOptions, RegExpWrapOptions } from "@rsc-utils/core-utils";
import { escapeRegex } from "@rsc-utils/core-utils";

/** Removes duplicate capture groups from the regex. */
function indexCaptureGroups(source: string): string {
	const map = { } as Record<string, number>;
	const increment = (key: string) => map[key] = ((map[key]) ?? -1) + 1;
	return source.replace(/\(\?<(\w+)>/g, (_, group) => `(?<${group}${increment(group) || ""}>`);
}

/** shim until this logic is put back into core-utils */
type WrapChars = { left:string; right:string; };
/** shim until this logic is put back into core-utils */
function splitChars(chars: string): WrapChars {
	//even
	if (chars.length % 2 === 0) {
		const half = chars.length / 2;
		return {
			left: chars.slice(0, half),
			right: chars.slice(half)
		};
	}

	//odd
	return {
		left: chars,
		right: chars.split("").reverse().join("")
	};
}

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
			? new RegExp(indexCaptureGroups(`(?:${lPattern}(?:${regexp.source})${rPattern})|(?:${regexp.source})`), regexp.flags) as U
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
