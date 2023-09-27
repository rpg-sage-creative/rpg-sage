/**
 * @todo figure out better logging so we can have .debug in dev but not in stable.
 * https://www.npmjs.com/package/pino
 * vs
 * https://www.npmjs.com/package/winston
 */

type LogLevel = "silly" | "debug" | "verbose" | "info" | "warn" | "error";

/** Common interface to ensure all logging functions are accessible. */
export interface Logger {
	log(level: LogLevel, ...args: any[]): void;

	silly(...args: any[]): void;
	debug(...args: any[]): void;
	verbose(...args: any[]): void;
	info(...args: any[]): void;
	warn(...args: any[]): void;
	error(...args: any[]): void;
}

/** The current logger. */
let _logger: Logger;

/** Extra events to happen when logging at a specific level. */
const _handlers = new Map<LogLevel, Set<Function>>();

/** Adds an extra handler to the given logging level. */
export function addLogHandler(level: LogLevel, handler: Function): void {
	if (!_handlers.has(level)) {
		_handlers.set(level, new Set());
	}
	_handlers.get(level)?.add(handler);
}

/** Stores the original methods to ensure validity. */
const _console = {
	debug: console.debug,
	error: console.error,
	log: console.log,
	warn: console.warn,
};

/** Returns the current logger. */
export function getLogger(): Logger {
	if (!_logger) {
		_console.debug(`debug::`, "NODE_ENV", process.env["NODE_ENV"]);

		/** Single logging function to ensure we don't duplicate code deciding which environment logs what. */
		function log(level: LogLevel, ...args: any[]) {
			// ignore certain events based on environment
			const env = process.env["NODE_ENV"];
			if (env === "beta") {
				if (["silly", "debug"].includes(level)) return;
			}
			if (env === "stable") {
				if (["silly", "debug", "verbose"].includes(level)) return;
			}

			// send the args to the proper logger function
			if (level === "error") _console.error(`${level}::`, ...args);
			else if (level === "warn") _console.warn(`${level}::`, ...args);
			else _console.log(`${level}::`, ...args);

			// send the args to any extra handlers
			_handlers.get(level)?.forEach(handler => handler(...args));
		}

		/** Create the default logger. */
		_logger = {
			log: log,
			silly: (...args: any) => log("silly", ...args),
			debug: (...args: any) => log("debug", ...args),
			verbose: (...args: any) => log("verbose", ...args),
			info: (...args: any) => log("info", ...args),
			warn: (...args: any) => log("warn", ...args),
			error: (...args: any) => log("error", ...args)
		};
	}
	return _logger;
}

/** Convenience for getLogger().log(level, ...args) */
export function log(level: LogLevel, ...args: any[]) {
	getLogger().log(level, ...args);
}

/** Convenience for getLogger().silly(...args) */
export function silly(...args: any[]) {
	getLogger().silly(...args);
}

/** Convenience for getLogger().debug(...args) */
export function debug(...args: any[]) {
	getLogger().debug(...args);
}

/** Convenience for getLogger().verbose(...args) */
export function verbose(...args: any[]) {
	getLogger().verbose(...args);
}

/** Convenience for getLogger().info(...args) */
export function info(...args: any[]) {
	getLogger().info(...args);
}

/** Convenience for getLogger().warn(...args) */
export function warn(...args: any[]) {
	getLogger().warn(...args);
}

/** Convenience for getLogger().error(...args) */
export function error(...args: any[]) {
	getLogger().error(...args);
}
