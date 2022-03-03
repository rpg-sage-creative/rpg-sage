import type { UUID } from "../types";
import { generate } from "../UuidUtils";

type TMap = Map<string, any>;
const CACHE_MAP: Map<UUID, TMap> = new Map();

export default class ClassCache {
	//#region instance

	/** Construct a new ClassCache for the given UUID. */
	public constructor(public key: UUID = generate()) { }

	/** Get the map for this cache instance. */
	private get map(): TMap {
		return ClassCache.get(this.key);
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
		const oldMaps = Array.from(CACHE_MAP.values());
		CACHE_MAP.clear();
		oldMaps.forEach(map => map.clear());
	}

	/** Removes the cache for the HasCache object with the given UUID. */
	public static delete(key: UUID): boolean {
		if (CACHE_MAP.has(key)) {
			CACHE_MAP.delete(key);
			return true;
		}
		return false;
	}

	/** Gets the cache for the HasCache object with the given UUID. */
	public static get(key: UUID): TMap {
		if (!CACHE_MAP.has(key)) {
			CACHE_MAP.set(key, new Map());
		}
		return CACHE_MAP.get(key) as TMap;
	}

	//#endregion
}