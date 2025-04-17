type ValueFn<T, U> = (value: T) => { skip:boolean; value:U; };

/**
 * Used by EphemeralMap and EphemeralSet to wrap their iterators.
 */
function wrapIterableIterator<T, U>(original: IterableIterator<T>, valueFn: ValueFn<T, U>): IterableIterator<U> {
	const array = Array.from(original);
	const wrapped = {
		[Symbol.iterator]() {
			return this;
		},
		next: () => {
			while (array.length) {
				const { value, skip } = valueFn(array.shift() as T);
				if (!skip) {
					return { value, done:false };
				}
			}
			return { done: true };
		}
	};
	return wrapped as IterableIterator<U>;
}

/**
 * Provides the basic functionality for removing elements on a timer.
 * Also provides basic functions common to both Map and Set.
 */
export abstract class EphemeralBase<K, V = K> {
	protected map: Map<K, { ts:number; value:V; }>;

	public constructor(msToLive: number);
	public constructor(private _msToLive: number) {
		if ((_msToLive || 0) < 1) {
			throw new RangeError("msToLive must be > 1");
		}
		this.map = new Map();
	}

	// [Symbol.iterator](): IterableIterator<T>

	// get [Symbol.toStringTag](): string

	/** How many milliseconds before a value gets removed. */
	public get msToLive(): number {
		return this._msToLive;
	}

	// add (Set)

	/** Removes all values */
	public clear(): void {
		this.map.clear();
		this.clearTimer();
	}

	/** Removes the given value */
	public delete(key: K): boolean {
		const deleted = this.map.delete(key);
		if (!this.map.size) this.clearTimer();
		return deleted;
	}

	/** iterate the entries as [key, value] */
	public entries(): IterableIterator<[K, V]> {
		return wrapIterableIterator(this.map.keys(), key => {
			return {
				value: [key, this.map.get(key)?.value!],
				skip: !this.map.has(key)
			};
		});
	}

	// public abstract forEach(fn: (value: V, value2: K, set: EphemeralBase<K, V>) => unknown, thisArg?: any): void;

	// get (Map)

	public has(key: K): boolean {
		return this.map.has(key);
	}

	public keys(): IterableIterator<K> {
		return wrapIterableIterator(this.map.keys(), key => {
			return {
				value: key,
				skip: !this.map.has(key)
			};
		});
	}

	protected set(key: K, value: V): this {
		this.map.set(key, { ts:Date.now(), value });
		this.queue();
		return this;
	}

	public get size(): number {
		return this.map.size;
	}

	public values(): IterableIterator<V> {
		return wrapIterableIterator(this.map.keys(), key => {
			return {
				value: this.map.get(key)?.value!,
				skip: !this.has(key)
			};
		});
	}

	/** timeout reference */
	private _timer?: NodeJS.Timeout;

	/** clean the _timer property */
	private clearTimer(): void {
		// clear timer
		clearTimeout(this._timer);
		// unset timer
		delete this._timer;
	}

	/** queues up the process */
	private queue(): void {
		if (this.map.size && !this._timer && !this._cleaning) {
			this._timer = setTimeout(() => this.clean(), this._msToLive);
		}
	}

	/** activity flag */
	private _cleaning = false;

	/** processes the map to remove expired data */
	private clean() {
		// flag as cleaning
		this._cleaning = true;

		// calculate cutoff time
		const cutOff = Date.now() - this._msToLive;

		// get finite set of keys
		const keys = Array.from(this.keys());

		// iterate keys
		for (const key of keys) {
			// .clear() might empty the map and thus make this pointless
			if (!this.map.size) {
				break;
			}

			// get timestamp for key
			const ts = this.map.get(key)?.ts ?? 0;

			// remove old key
			if (ts < cutOff) {
				this.delete(key);
			}
		}

		// clear timer
		this.clearTimer();

		// flag as not cleaning
		this._cleaning = false;

		// in case items were added while cleaning
		this.queue();
	}

	/** @internal Added so that JSON.stringify would treat this more like a Map/Set and not throw a TypeError trying to serialize ._timer */
	protected toJSON() {
		return { map:this.map, msToLive:this._msToLive };
	}
}
