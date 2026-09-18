import { Cache } from "./Cache.js";

/**
 * An abstract class that includes a built in Cache object.
 */
export abstract class HasCache {

	private _cache?: Cache;
	private _msToLive?: number;

	protected constructor();
	protected constructor(msToLive: number);
	protected constructor(cache: Cache);
	protected constructor(msToLiveOrCache?: number | Cache) {
		if (typeof(msToLiveOrCache) === "number") {
			this._msToLive = msToLiveOrCache;
		}else if (msToLiveOrCache instanceof Cache) {
			this._cache = msToLiveOrCache;
		}
	}

	/** Provides a caching mechanism for all child classes. */
	protected get cache(): Cache {
		return this._cache ?? (this._cache = new Cache(this._msToLive ?? 0));
	}

	/** Destroy's this class' cache. */
	public destroy(): void {
		this._cache?.destroy();
		delete this._cache;
	}
}
