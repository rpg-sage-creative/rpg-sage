import { ClassCache } from "./internal/ClassCache";
import { SuperClass } from "./SuperClass";

/**
 * An abstract class that includes a cache object.
 */
export abstract class HasCache extends SuperClass {

	protected constructor(private _cache?: ClassCache | null) {
		super();
	}

	/** Provides a caching mechanism for all SuperClass classes. */
	protected get cache(): ClassCache {
		return this._cache ?? (this._cache = new ClassCache());
	}

	/** Destroy's this class' cache. */
	public destroy(): void {
		this._cache?.destroy();
		this._cache = null;
	}
}
