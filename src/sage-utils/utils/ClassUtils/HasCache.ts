import { ClassCache } from "./internal/ClassCache";
import { SuperClass } from "./SuperClass";

/**
 * An abstract class that includes a cache object.
 */
export abstract class HasCache extends SuperClass {

	/** Provides a caching mechanism for all SuperClass classes. */
	private _cache?: ClassCache | null;
	protected get cache(): ClassCache {
		return this._cache ?? (this._cache = new ClassCache());
	}

	/** Destroy's this class' cache. */
	public destroy(): void {
		this._cache?.destroy();
		this._cache = null;
	}
}
