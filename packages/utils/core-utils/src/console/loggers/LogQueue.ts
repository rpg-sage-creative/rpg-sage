import { debug } from "./debug.js";

export class LogQueue {
	/** array of objets to log */
	public items: unknown[];

	public constructor(public fn: string, public initial: unknown, public logger: Function = debug) {
		this.items = [];
		this.add({ initial });
	}

	/** adds an object to the queue */
	public add(...items: unknown[]) {
		items.forEach(data => {
			this.items.push({ fn:this.fn, ...data as object })
		});
	}

	/** logs all the items in the queue */
	public log(logger: Function = this.logger) {
		this.items.forEach(item => logger(item));
	}

	/**
	 * adds the given object to the queue.
	 * logs all the items in the queue if: this.initial !== final
	 */
	public logDiff(final: unknown) {
		this.add({ final });
		if (this.initial !== final) {
			this.log();
		}
	}

	/**
	 * adds the given object to the queue.
	 * logs all the items in the queue if: this.initial === final
	 */
	public logSame(final: unknown) {
		this.add({ final });
		if (this.initial === final) {
			this.log();
		}
	}
}