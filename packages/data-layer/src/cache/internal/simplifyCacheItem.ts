import type { GameCacheItem, GlobalCacheItem } from "../types.js";

/**
 * @internal
 * Simplifies the given object to a basic form for caching in memory and still enabling some properties to be searched.
 */
export function simplifyCacheItem<T extends GlobalCacheItem | GameCacheItem>(core: T): GlobalCacheItem | GameCacheItem {
	let {

		// GlobalCacheItem
		id, did, uuid, objectType,

		// GameCacheItem
		archivedTs, channels, serverDid, users

	} = core as GameCacheItem;

	// GameRepo does lookups by channel: id, did
	channels = channels?.map(({ id, did }) => ({ id, did }));

	// GameRepo does lookups by user: did
	users = users?.map(({ did }) => ({ did }));

	return { id, did, uuid, objectType, serverDid, archivedTs, users, channels };
}