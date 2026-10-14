import type { LogFn as PinoLogFn } from "pino";
import { Logger } from "./Logger.js";

/**
 * Convenience for Logger.instance.pino.trace().
 * Triggers Logger.init() only on the first use.
 */
export const trace: PinoLogFn = function(...args: unknown[]) {
	Logger.instance.pino.trace(...args as [object, string]);
}

/**
 * Convenience for Logger.instance.pino.debug().
 * Triggers Logger.init() only on the first use.
 */
export const debug: PinoLogFn = function(...args: unknown[]) {
	Logger.instance.pino.debug(...args as [object, string]);
}

/**
 * Convenience for Logger.instance.pino.info().
 * Triggers Logger.init() only on the first use.
 */
export const info: PinoLogFn = function(...args: unknown[]) {
	Logger.instance.pino.info(...args as [object, string]);
}

/**
 * Convenience for Logger.instance.pino.warn().
 * Triggers Logger.init() only on the first use.
 */
export const warn: PinoLogFn = function(...args: unknown[]) {
	Logger.instance.pino.warn(...args as [object, string]);
}

/**
 * Convenience for Logger.instance.pino.error().
 * Triggers Logger.init() only on the first use.
 */
export const error: PinoLogFn = function(...args: unknown[]) {
	Logger.instance.pino.error(...args as [object, string]);
}

/**
 * Convenience for Logger.instance.pino.fatal().
 * Triggers Logger.init() only on the first use.
 */
export const fatal: PinoLogFn = function(...args: unknown[]) {
	Logger.instance.pino.fatal(...args as [object, string]);
}
