import type { ChildLoggerOptions, LogFn, Bindings as PinoBindings, Logger as PinoLogger } from "pino";
import { vitest } from "vitest";

export type LoggerLike = {
	trace: LogFn;
	debug: LogFn;
	info: LogFn;
	warn: LogFn;
	error: LogFn;
	fatal: LogFn;
};

export class PinoWrapper implements LoggerLike {

	/** the pino logger for this instance */
	public readonly pino: PinoLogger;

	public constructor(pino: PinoLogger) {
		this.pino = pino;
	}

	/** Creates and returns a child of this LoggerInstance. */
	public child(bindings: PinoBindings, options?: ChildLoggerOptions): PinoWrapper {
		return new PinoWrapper(this.pino.child(bindings, options));
	}

	/**
	 * Creates a "logger".
	 * Logs the args to the given handler.
	 * Ensures a valid "this" object so that the catcher can be passed to a Promise or iterator.
	 */
	public createLogFn(handler: "trace" | "debug" | "info" | "warn" | "error" | "fatal"): LogFn {
		return (...args: any[]) => {
			this.pino[handler](...args as [object, string]);
		};
	}

	//#region loggers

	public trace = this.createLogFn("trace");

	public debug = this.createLogFn("debug");

	public info = this.createLogFn("info");

	public warn = this.createLogFn("warn");

	public error = this.createLogFn("error");

	public fatal = this.createLogFn("fatal");

	//#endregion

	/**
	 * Creates a "catcher" for Promise objects.
	 * Logs the reason to the given handler and then returns the given returnValue.
	 * Ensures a valid "this" object so that the catcher can be passed to a Promise.
	 */
	public createCatcher<T>(handler: "trace" | "debug" | "info" | "warn" | "error" | "fatal", returnValue: T): (err: any) => T {
		return (err: any) => {
			this.pino[handler](err);
			return returnValue;
		};
	}

	//#region catchers

	/** Used for catching a Promise. Logs the reason to .error() and then returns []. */
	public errorReturnEmptyArray = this.createCatcher("error", [] as []);

	/** Used for catching a Promise. Logs the reason to .error() and then returns false. */
	public errorReturnFalse = this.createCatcher("error", false as false);

	/** Used for catching a Promise. Logs the reason to .error() and then returns undefined. */
	public errorReturnUndefined = this.createCatcher("error", undefined);

	/** Used for catching a Promise. Logs the reason to .warn() and then returns undefined. */
	public warnReturnUndefined = this.createCatcher("warn", undefined);

	//#endregion

	/** Used to quickly make a LoggerLike with loggers that have been spied on by vitest specifically for unit testing. */
	public spyOn(): LoggerLike {
		const trace = vitest.spyOn(this as { trace:LogFn; }, "trace");
		const debug = vitest.spyOn(this as { debug:LogFn; }, "debug");
		const info = vitest.spyOn(this as { info:LogFn; }, "info");
		const warn = vitest.spyOn(this as { warn:LogFn; }, "warn");
		const error = vitest.spyOn(this as { error:LogFn; }, "error");
		const fatal = vitest.spyOn(this as { fatal:LogFn; }, "fatal");
		return { trace, debug, info, warn, error, fatal };
	}
}