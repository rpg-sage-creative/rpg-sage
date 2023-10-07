import { wrapIterableIterator } from "./internal/wrapIterableIterator";

export class EphemeralSet<T> implements Set<T> {
	private map: Map<T, number>;

	public constructor(msToLive: number);
	public constructor(private _msToLive: number) {
		this.map = new Map();
	}

	[Symbol.iterator](): IterableIterator<T> {
		return this.values();
	}

	get [Symbol.toStringTag](): string {
		return "EphemeralSet";
	}

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

	/** delete the value */
	public delete(value: T): boolean {
		return this.map.delete(value);
	}

	/** iterate the entries as [value, value] */
	public entries(): IterableIterator<[T, T]> {
		return wrapIterableIterator(this.map.keys(), value => {
			return { value:[value, value], skip:!this.has(value) };
		});
	}

	public forEach(fn: (value: T, value2: T, set: EphemeralSet<T>) => unknown, thisArg?: any): void {
		for (const entry of this.entries()) {
			fn.call(thisArg, entry[1], entry[0], this);
		}
	}

	public has(value: T): boolean {
		return this.map.has(value);
	}

	public keys(): IterableIterator<T> {
		return wrapIterableIterator(this.map.keys(), value => {
			return { value, skip:!this.has(value) };
		});
	}

	public get size(): number {
		return this.map.size;
	}

	public values(): IterableIterator<T> {
		return wrapIterableIterator(this.map.keys(), value => {
			return { value, skip:!this.has(value) };
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
