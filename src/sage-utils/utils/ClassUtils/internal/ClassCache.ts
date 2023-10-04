import type { Awaitable } from "../../..";

/** Set of all ClassCache objects. */
let _cacheSet: WeakSet<ClassCache>;

export class ClassCache {
	//#region instance

	private _cache?: Map<string, any> | null;

	/** Construct a new ClassCache for the given id. */
	public constructor() {
		const cacheSet = _cacheSet ?? (_cacheSet = new WeakSet());
		cacheSet.add(this);
	}

	/**
	 * Removes all values from this cache instance.
	 * Returns true if keys were removed, false otherwise.
	 */
	public clear(): boolean {
		const cache = this._cache;
		const size = cache?.size ?? 0;
		if (size > 0) {
			cache!.clear();
			return true;
		}
		return false;
	}

	/**
	 * Removes a single value from this cache instance.
	 * Returns true if the key was removed, false otherwise.
	 */
	public delete(key: string): boolean {
		return this._cache?.delete(key) ?? false;
	}

	/**
	 * Clears this cache's values, nulls out the cache map, and removes the instance from the set of all caches.
	*/
	public destroy(): void {
		_cacheSet?.delete(this);
		this._cache?.clear();
		this._cache = null;
	}

	/**
	 * Returns the value for the key.
	 * If it hasn't been cached yet, the function is called to cache and return the value.
	 * Asynchronous version of get.
	 */
	public async fetch<T>(key: string, fn:() => Awaitable<T>): Promise<T> {
		const map = this._cache ?? (this._cache = new Map());
		if (!map.has(key)) {
			map.set(key, await fn());
		}
		return map.get(key);
	}

	/**
	 * Returns the value for the key.
	 * If it hasn't been cached yet, the function is called to cache and return the value.
	 */
	public get<T>(key: string, fn:() => T): T {
		const map = this._cache ?? (this._cache = new Map());
		if (!map.has(key)) {
			map.set(key, fn());
		}
		return map.get(key);
	}

	//#endregion

	//#region static

	/** Clears all the caches for all the ClassCache objects. */
	public static clear(): void {
		if (_cacheSet) {
			Set.prototype.forEach.call(_cacheSet, (classCache: ClassCache) => classCache.clear());
		}
	}

	//#endregion
}