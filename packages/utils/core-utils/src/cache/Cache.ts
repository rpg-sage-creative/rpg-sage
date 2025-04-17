import type { Awaitable } from "../types/generics.js";
import { EphemeralMap } from "./EphemeralMap.js";

/** Set of all ClassCache objects. */
let _cacheSet: WeakSet<Cache>;

/**
 * A simple Cache mechanism.
 * Includes synchronous get an asynchronous fetch.
 * Allows for data to be cached using EphemeralMap.
 */
export class Cache {
	//#region instance

	/** The cache */
	private _cache?: Map<string, any>;

	/** The msToLive for EphemeralMap */
	private _msToLive?: number;

	/**
	 * Construct a new ClassCache using a Map.
	 */
	public constructor();

	/**
	 * Construct a new ClassCache using an EphemeralMap.
	 */
	public constructor(msToLive: number);

	public constructor(msToLive?: number) {
		this._msToLive = msToLive;
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
	 * Clears this cache's values, deletes the cache map, and removes the instance from the set of all caches.
	*/
	public destroy(): void {
		_cacheSet?.delete(this);
		this._cache?.clear();
		delete this._cache;
	}

	/**
	 * Returns the value for the key.
	 * If it hasn't been cached yet, undefined is returned instead.
	 */
	public get<T>(key: string): T | undefined {
		const map = this.getOrCreateCache();
		if (!map.has(key)) {
			return undefined;
		}
		return map.get(key);
	}

	/**
	 * Returns the value for the key.
	 * If it hasn't been cached yet, the function is called to cache and return the value.
	 * Asynchronous version of get.
	 */
	public async getOrFetch<T>(key: string, fn:() => Awaitable<T>): Promise<T> {
		const map = this.getOrCreateCache();
		if (!map.has(key)) {
			map.set(key, await fn());
		}
		return map.get(key);
	}

	/**
	 * Returns the value for the key.
	 * If it hasn't been cached yet, the function is called to cache and return the value.
	 */
	public getOrSet<T>(key: string, fn:() => T): T {
		const map = this.getOrCreateCache();
		if (!map.has(key)) {
			map.set(key, fn());
		}
		return map.get(key);
	}

	/** Gets the internal cache map, creating it if needed. */
	protected getOrCreateCache(): Map<string, any> {
		if (!this._cache) {
			if (this._msToLive) {
				this._cache = new EphemeralMap(this._msToLive);
			}else {
				this._cache = new Map();
			}
		}
		return this._cache;
	}

	//#endregion

	//#region static

	/** Clears all the caches for all the ClassCache objects. */
	public static clear(): void {
		if (_cacheSet) {
			Set.prototype.forEach.call(_cacheSet, (cache: Cache) => cache.clear());
		}
	}

	//#endregion
}