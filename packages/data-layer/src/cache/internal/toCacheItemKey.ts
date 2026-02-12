import type { CacheItemKey, CacheKey } from "../types.js";

/**
 * @internal
 * Makes sure we have a CacheItemKey
 */
export function toCacheItemKey(value: CacheKey): CacheItemKey {
	switch(value) {
		case "Game": return "games";
		case "Server": return "servers";
		case "User": return "users";
		default: return value;
	}
}