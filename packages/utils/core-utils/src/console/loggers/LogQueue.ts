import { debug } from "./debug.js";

/**
 * LogQueue allows you to queue up log writes and decide to send them later.
 * The primary use case is that you are iterating but only want to see log writes during certain conditions.
 * You simply use .add(...args) to add writes to the queue (the "initial" argument is always added).
 * Calling .log() will send the items to the appropriate logger (info, debug, warn, error, etc)
 * You can also call .logDiff() to add a "final" value to the queue and only log if it is a different object than "initial".
 * You can also call .logSame() to add a "final" value to the queue and only log if it is the same object as "initial".
 * NOTE: These two checks use ===, so a mutated object is still the same object.
*/
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