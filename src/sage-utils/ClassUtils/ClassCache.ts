/** Key/Value type map for each Class instance. */
type TMap = Map<string, any>;

/** Numeric id of each ClassCache created */
let cacheMapId = 0;

/** Set of all Key/Value maps. */
let cacheMap: Map<number, TMap>;

/** Getter that creates map on first access. */
function getCacheMap(): Map<number, TMap> {
	return cacheMap ?? (cacheMap = new Map());
}

export class ClassCache {
	//#region instance

	/** Construct a new ClassCache for the given UUID. */
	public constructor(public id = cacheMapId++) { }

	/** Get the map for this cache instance. */
	private get map(): TMap {
		return ClassCache.get(this.id);
	}

	/** Removes all values from this cache instance. Returns true if data was removed, false otherwise. */
	public clear(): boolean {
		const map = this.map;
		if (map.size > 0) {
			map.clear();
			return true;
		}
		return false;
	}

	/** Removes a single value from this cache instance. Returns true if data was removed, false otherwise. */
	public delete(key: string): boolean {
		const map = this.map;
		if (map.has(key)) {
			map.delete(key);
			return true;
		}
		return false;
	}

	/** Returns the value for the key, using the given function only if the value isn't cached yet. */
	public get<T>(key: string, fn:() => T): T {
		const map = this.map;
		if (!map.has(key)) {
			map.set(key, fn());
		}
		return map.get(key);
	}

	//#endregion

	//#region static

	/** Removes all the caches for all the HasCache objects. */
	public static clear(): void {
		const map = getCacheMap();
		const oldMaps = Array.from(map.values());
		map.clear();
		oldMaps.forEach(oldMap => oldMap.clear());
	}

	/** Removes the cache for the HasCache object with the given UUID. */
	public static delete(key: number): boolean {
		const map = getCacheMap();
		if (map.has(key)) {
			map.delete(key);
			return true;
		}
		return false;
	}

	/** Gets the cache for the HasCache object with the given UUID. */
	public static get(key: number): TMap {
		const map = getCacheMap();
		if (!map.has(key)) {
			map.set(key, new Map());
		}
		return map.get(key) as TMap;
	}

	//#endregion
}