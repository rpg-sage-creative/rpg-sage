import type { CharacterCacheItem, GameCacheItem, GlobalCacheItem } from "../types.js";

type AnyCacheItem = GlobalCacheItem | GameCacheItem | CharacterCacheItem;

/**
 * @internal
 * Simplifies the given object to a basic form for caching in memory and still enabling some properties to be searched.
 */
export function simplifyCacheItem<
	Core extends GlobalCacheItem,
	CacheItem extends GlobalCacheItem,
>(
	core: Core
): CacheItem {

	// GlobalCacheItem
	let { did, id, objectType, updatedTs, uuid, } = core;

	// GameCacheItem
	let { archivedTs, channels, serverDid, serverId, users, } = core as AnyCacheItem as GameCacheItem;

	// CharacterCacheItem
	let { alias, gameId, name, userId, } = core as AnyCacheItem as CharacterCacheItem;

	// GameRepo does lookups by channel: id, did
	channels = channels?.map(({ id, did }) => ({ id, did }));

	// GameRepo does lookups by user: did
	users = users?.map(({ did }) => ({ did }));

	return {
		// GlobalCacheItem
		did, id, objectType, updatedTs, uuid,

		// GameCacheItem
		archivedTs, channels, serverDid, serverId, users,

		// CharacterCacheItem
		alias, gameId, name, userId,
	} as AnyCacheItem as CacheItem;

}

/**
 * @internal
 * Creates an in memory cache item that is purely ids and objectType. (Mostly used for logging output.)
 */
export function simplifyForLogging(
	item: GlobalCacheItem
): GlobalCacheItem {

	const { id, did, uuid, objectType } = item;
	return { id, did, uuid, objectType };

}