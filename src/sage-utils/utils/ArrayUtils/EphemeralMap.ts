
type EphemeralValue<Value> = { ts:number; value:Value; };

export class EphemeralMap<Key, Value> {
	/** @todo a proper Iterator */

	private map: Map<Key, EphemeralValue<Value>>;

	public constructor(msToLive: number);
	public constructor(private _msToLive: number) {
		this.map = new Map();
	}

	public get msToLive(): number {
		return this._msToLive;
	}

	/** sets a value to the data and then queues up the process */
	public set(key: Key, value: Value): this {
		this.map.set(key, { ts:Date.now(), value });
		this.queue();
		return this;
	}

	/** Empty the map */
	public clear(): void {
		this.map.clear();
		this.clearTimer();
	}

	public delete(key: Key): boolean {
		return this.map.delete(key);
	}

	/** @todo a proper IterableIterator<[Key, Value]> */
	public entries(): [Key, Value][] {
		return Array.from(this.map.entries()).map(([key, ephValue]) => [key, ephValue.value]);
	}

	public forEach(fn: (value: Value, key: Key, map: EphemeralMap<Key, Value>) => unknown, thisArg?: any): void {
		this.entries().forEach(([key, value]) => fn.call(thisArg, value, key, this));
	}

	public get(key: Key): Value | undefined {
		return this.map.get(key)?.value;
	}

	public has(key: Key): boolean {
		return this.map.has(key);
	}

	public keys() {
		return this.map.keys();
	}

	public get size(): number {
		return this.map.size;
	}

	/** @todo a proper IterableIterator<[Value]> */
	public values() {
		return Array.from(this.map.values()).map(ephValue => ephValue.value);
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
}
