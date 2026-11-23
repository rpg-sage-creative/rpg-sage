import { rangeError } from "@rsc-utils/error-utils";

/**
 * Provides the basic functionality for removing elements on a timer.
 * Also provides basic functions common to both Map and Set.
 */
export abstract class EphemeralBase<K, V = K> {
	protected map: Map<K, { ts:number; value:V; }>;

	public constructor(
		/** How many milliseconds before a value gets removed. Must be between 1 and Infinity (exclusive). */
		public readonly msToLive: number
	) {
		if (!Number.isFinite(msToLive) || !(msToLive > 1)) {
			throw rangeError({ argKey:"msToLive", mustBe:"a finite number greater than 1", value: msToLive });
		}
		this.map = new Map();
	}

	// [Symbol.iterator](): IterableIterator<T>

	// get [Symbol.toStringTag](): string

	// add (Set)

	/** Removes all values */
	public clear(): void {
		this.map.clear();
		this.clearTimer();
	}

	/** Removes the given value */
	public delete(key: K): boolean {
		const deleted = this.map.delete(key);
		if (!this.map.size) {
			this.clearTimer();
		}
		return deleted;
	}

	// entries

	// public abstract forEach(fn: (value: V, value2: K, set: EphemeralBase<K, V>) => unknown, thisArg?: any): void;

	// get (Map)

	/**
	 * Whether the key holds a NON-EXPIRED value.
	 * Expired entries are deleted as accessed.
	 */
	public has(key: K): boolean {
		return this.takeLiveEntry(key) !== undefined;
	}

	// keys
	public abstract keys(): IterableIterator<K>;

	protected set(key: K, value: V): this {
		this.map.set(key, { ts:Date.now(), value });
		this.queue();
		return this;
	}

	/**
	 * The number of stored entries.
	 * NOTE: May briefly include expired entries while running cleanup().
	 */
	public get size(): number {
		return this.map.size;
	}

	//#region expiration

	/**
	 * The timestamp boundary at which entries are considered expired: everything with ts <= cutoff is expired.
	 */
	protected getCutoff(): number {
		return Date.now() - this.msToLive;
	}

	/**
	 * Whether the entry's timestamp is at or past its ttl cutoff.
	 * Scans may pass a hoisted cutOff to pay Date.now() once instead of once per entry.
	 */
	protected isExpired(entry: { ts:number; }, cutOff = this.getCutoff()): boolean {
		return entry.ts <= cutOff;
	}

	/**
	 * Returns the stored entry, or undefined (when missing OR expired) — NO MUTATION.
	 * Scans pass a hoisted cutOff for snapshot expiry at scan cost of one clock read.
	 */
	protected liveEntry(key: K, cutOff?: number): { ts:number; value:V; } | undefined {
		const entry = this.map.get(key);
		return entry === undefined || this.isExpired(entry, cutOff)
			? undefined
			: entry;
	}

	/**
	 * Returns the stored entry, or undefined (when missing OR expired) — expired entries are deleted.
	 */
	protected takeLiveEntry(key: K): { ts:number; value:V; } | undefined {
		const entry = this.liveEntry(key);
		// delete the entry if expired but present
		if (entry === undefined && this.map.has(key)) {
			this.delete(key);
		}
		return entry;
	}

	//#endregion

	/** timeout reference */
	private _timer?: NodeJS.Timeout;

	/** clean the _timer property */
	private clearTimer(): void {
		// clear timer
		clearTimeout(this._timer);
		// unset timer
		delete this._timer;
	}

	/** queues up the process, defaulting to a full msToLive delay */
	private queue(delayMs?: number): void {
		if (this.map.size && !this._timer && !this._cleaning) {
			this._timer = setTimeout(() => this.clean(), delayMs ?? this.msToLive);
		}
	}

	/** activity flag */
	private _cleaning = false;

	/** processes the map to remove expired data and reschedules for the earliest remaining expiry */
	private clean() {
		// flag as cleaning
		this._cleaning = true;

		// calculate cutoff time
		const cutOff = this.getCutoff();

		// we set the timer to trigger when the next item to expire should expire
		let nextExpiryTs: number | undefined;

		// iterate the data
		for (const [ key, entry ] of this.map) {
			if (this.isExpired(entry, cutOff)) {
				// remove old key
				this.delete(key);
			}else {
				// check expiration against next expiration
				const expiryTs = entry.ts + this.msToLive;
				if (nextExpiryTs === undefined || expiryTs < nextExpiryTs) {
					// set as next expiration
					nextExpiryTs = expiryTs;
				}
			}
		}

		// clear timer
		this.clearTimer();

		// flag as not cleaning
		this._cleaning = false;

		// queue next clean; if we have a next expiration ts, use it (Math.max ensures we have a min of 1 ms)
		this.queue(
			nextExpiryTs === undefined
				? undefined
				: Math.max(1, nextExpiryTs - Date.now())
		);
	}

	/**
	 * @internal Added so that JSON.stringify would treat this more like a Map/Set and not throw a TypeError trying to serialize ._timer.
	 * The data round-trips correctly through our own json-utils encodeJson/decodeJson/cloneJson — the internal Map hits encodeJson's $map wrapper, so every entry (key, value, AND timestamp) survives; decodeJson hands back a plain { map, msToLive } object with a real restored Map, not an EphemeralMap/EphemeralSet instance.
	 * Standard JSON.stringify still drops data incorrectly — the internal Map serializes as {} and all entries are lost.
	 * TODO: consider this as a possible test for point for decodeJson with custom Map/Set classes; i suspect it would involve adding a static reviver to EphemeralMap/EphemeralSet
	 */
	protected toJSON() {
		return { map:this.map, msToLive:this.msToLive };
	}
}
