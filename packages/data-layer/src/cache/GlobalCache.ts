import { error, getCodeName } from "@rsc-utils/core-utils";
import { toCacheItemKey } from "./internal/toCacheItemKey.js";
import type { CacheItemKey, DataMode, GameCacheItem, GlobalCacheItem } from "./types.js";
import { ObjectCache } from "./internal/ObjectCache.js";

export class GlobalCache {
	/** This is where the magic is stored. */
	private cache = new Map<CacheItemKey, ObjectCache<CacheItemKey>>();

	public constructor() { }

	public async fetch<T extends GlobalCacheItem>(item: GlobalCacheItem): Promise<T | undefined> {
		return this.for(toCacheItemKey(item.objectType))?.fetch(item) as Promise<T>;
	}

	public filter<Key extends CacheItemKey, CacheItem extends GlobalCacheItem = GlobalCacheItem>(key: Key, predicate: (core: CacheItem) => unknown): CacheItem[] {
		return this.for<Key, CacheItem>(key)?.filter(predicate) ?? [];
	}

	public find<Key extends CacheItemKey, CacheItem extends GlobalCacheItem = GlobalCacheItem>(key: Key, predicate: (core: CacheItem) => unknown): CacheItem | undefined {
		return this.for<Key, CacheItem>(key)?.find(predicate);
	}

	public for(key: "games"): ObjectCache<"games", GameCacheItem> | undefined;
	public for(key: "messages"): ObjectCache<"messages"> | undefined;
	public for(key: "servers"): ObjectCache<"games"> | undefined;
	public for(key: "users"): ObjectCache<"users"> | undefined;
	public for<Key extends CacheItemKey, CacheItem extends GlobalCacheItem = GlobalCacheItem>(key: Key): ObjectCache<Key, CacheItem> | undefined;
	public for(key: CacheItemKey): ObjectCache<any> | undefined {
		return this.cache.get(key);
	}

	public get<T extends GlobalCacheItem>(key: CacheItemKey, id: string): T | undefined {
		return this.for(key)?.get(id) as T;
	}

	public async put<T extends GlobalCacheItem>(key: CacheItemKey, item: T): Promise<boolean> {
		const cache = this.for(key);
		if (!cache) {
			error({ objectType:item.objectType, key });
			return false;
		}
		return cache.put(item);
	}

	public async populate(key: CacheItemKey): Promise<boolean> {
		if (!this.cache.has(key)) {
			this.cache.set(key, new ObjectCache(key, GlobalCache.DataMode[key], GlobalCache.FormatFiles));
		}
		return this.for(key)?.populate() ?? false;
	}

	public async validate(key: CacheItemKey): Promise<boolean> {
		if (!this.cache.has(key)) {
			this.cache.set(key, new ObjectCache(key, GlobalCache.DataMode[key], GlobalCache.FormatFiles));
		}
		return this.for(key)?.validate() ?? false;
	}

	public static initialize(): GlobalCache {
		GlobalCache.FormatFiles = getCodeName() === "dev";
		GlobalCache.Instance = new GlobalCache();
		return GlobalCache.Instance;
	}

	public static DataMode: Record<CacheItemKey, DataMode> = { games:"file", messages:"file", servers:"file", users:"file" };
	public static FormatFiles = false;
	public static Instance: GlobalCache;
}


