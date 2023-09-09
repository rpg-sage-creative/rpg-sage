// set.entries
// set.forEach

export class EphemeralSet<T> {
	/** @todo a proper Iterator */

	public constructor(msToLive: number);
	public constructor(private _msToLive: number) {
		this.map = new Map();
	}

	private map: Map<T, number>;
	public get msToLive(): number {
		return this._msToLive;
	}

	/** adds a value to the data and then queues up the process */
	public add(value: T): this {
		this.map.set(value, Date.now());
		this.queue();
		return this;
	}

	/** Empty the set */
	public clear(): void {
		this.map.clear();
		this.clearTimer();
	}

	public delete(value: T): boolean {
		return this.map.delete(value);
	}

	/** @todo a proper InterableIterator<[T, T]> */
	public entries(): [T, T][] {
		return Array.from(this.map.keys()).map(key => [key, key]);
	}

	public forEach(fn: (value: T, value2: T, set: EphemeralSet<T>) => unknown, thisArg?: any): void {
		Array.from(this.map.keys()).forEach(key => fn.call(thisArg, key, key, this));
	}

	public has(value: T): boolean {
		return this.map.has(value);
	}

	public keys() {
		return this.map.keys();
	}

	public get size(): number {
		return this.map.size;
	}

	public values() {
		return this.map.keys();
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
			const ts = this.map.get(key) ?? 0;

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
}
