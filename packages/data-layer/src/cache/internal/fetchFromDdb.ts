import type { OrUndefined } from "@rsc-utils/core-utils";
import type { CacheItemKey, GlobalCacheItem } from "../types.js";

export async function fetchFromDdb<T extends GlobalCacheItem>(key: CacheItemKey, item: GlobalCacheItem): Promise<OrUndefined<T>> {
	key;
	item;
	return undefined;
}