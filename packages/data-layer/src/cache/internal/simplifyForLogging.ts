import type { GlobalCacheItem } from "../types.js";

/**
 * @internal
 * Creates an in memory cache item that is purely ids and objectType. (Mostly used for logging output.)
 */
export function simplifyForLogging(item: GlobalCacheItem): GlobalCacheItem {
	const { id, did, uuid, objectType } = item;
	return { id, did, uuid, objectType };
}