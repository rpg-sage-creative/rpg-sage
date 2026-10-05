import { getHandlers } from "./handlers.js";
import { isLogLevelEnabled, type LogLevelName } from "./logLevels.js";

/** Common interface to ensure all logging functions are accessible. */
export interface Logger {
	silly(...args: any[]): void;
	debug(...args: any[]): void;
	verbose(...args: any[]): void;
	http(...args: any[]): void;
	info(...args: any[]): void;
	warn(...args: any[]): void;
	error(...args: any[]): void;
}

/** The current logger. */
let _logger: Logger;

/** Returns the current logger. */
export function getLogger(): Logger {
	if (!_logger) {

		/** Single logging function to ensure we don't duplicate code deciding which environment logs what. */
		const log = (logLevel: LogLevelName, ...args: any[]) => {
			if (!isLogLevelEnabled(logLevel)) {
				return;
			}

			// we only want logLevel:: if we have args; otherwise we want a blank line ...
			const outArgs = args.length ? [logLevel].concat(args) : [``];

			// send updated outArgs to the proper logger function
			if (logLevel === "error") {
				console.error(...outArgs);
			}else if (logLevel === "warn") {
				console.warn(...outArgs);
			}else {
				console.log(...outArgs);
			}

			// send the original args to any extra handlers
			getHandlers()?.get(logLevel)?.forEach(handler => handler(...args));
		};

		/** Create the default logger. */
		_logger = {
			silly: (...args: any) => log("silly", ...args),
			debug: (...args: any) => log("debug", ...args),
			verbose: (...args: any) => log("verbose", ...args),
			http: (...args: any) => log("http", ...args),
			info: (...args: any) => log("info", ...args),
			warn: (...args: any) => log("warn", ...args),
			error: (...args: any) => log("error", ...args)
		};
	}
	return _logger;
}

/** Convenience for getLogger().debug(...args) */
export function debug(...args: any[]) {
	getLogger().debug(...args);
}

/** Convenience for getLogger().error(...args) */
export function error(...args: any[]) {
	getLogger().error(...args);
}

/** Convenience for getLogger().http(...args) */
export function http(...args: any[]) {
	getLogger().http(...args);
}

/** Convenience for getLogger().info(...args) */
export function info(...args: any[]) {
	getLogger().info(...args);
}

/** Convenience for getLogger().silly(...args) */
export function silly(...args: any[]) {
	getLogger().silly(...args);
}

/** Convenience for getLogger().verbose(...args) */
export function verbose(...args: any[]) {
	getLogger().verbose(...args);
}

/** Convenience for getLogger().warn(...args) */
export function warn(...args: any[]) {
	getLogger().warn(...args);
}