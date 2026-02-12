export type CacheItemKey = "games" | "messages" | "servers" | "users";

export type CacheItemObjectType = "Game" | "Server" | "User";

export type CacheKey = CacheItemObjectType | CacheItemKey;

export type DataMode = "file" | "ddb" | "file-first" | "ddb-first";

/** The most basic form of global in memory cache items. */
export type GlobalCacheItem = {
	id: string;
	did?: string;
	uuid?: string;
	objectType: CacheItemObjectType;
};

export type CharacterCacheItem = GlobalCacheItem & {
	name: string;
	alias?: string;
};

/** The global in memory cache item used for Games. */
export type GameCacheItem = GlobalCacheItem & {
	serverDid: string;
	archivedTs?: number;
	users?: {
		did?: string;
	}[];
	channels?: {
		id: string;
		did?: string;
	}[];
};
