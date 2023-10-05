import { appendFile } from "fs";
import { getDateStrings } from "../DateUtils";
import { formatArg } from "./formatArgs";

/**
 * @todo figure out better logging so we can have .debug in dev but not in stable.
 * https://www.npmjs.com/package/pino
 * vs
 * https://www.npmjs.com/package/winston
 */

export type LogLevel = "silly" | "debug" | "verbose" | "info" | "warn" | "error";

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

let _env: "dev" | "beta" | "stable" = process.env["NODE_ENV"] as "dev" ?? "dev";
let _logDir: string | undefined;

export function setEnv(env: "dev" | "beta" | "stable"): void {
	_env = env;
	_logDir = `./data/sage/logs/${env}`;
	["silly", "debug", "verbose", "info", "warn", "error"].forEach(level => addLogHandler(level as "silly", logToFile))
}


/** Logs the args to file if we have a folder to log to. */
function logToFile(logLevel: LogLevel, ...args: any[]): void {
	if (_logDir) {
		const now = getDateStrings();
		const fileName = `${_logDir}/${now.date}.log`;
		const lines = args.map(arg => `${now.date}T${now.time}: ${logLevel}:: ${formatArg(arg)}`).concat("").join("\n");
		appendFile(fileName, lines, err => {
			if (err) {
				try {
					error("Unable to log to file!", err);
				}catch(ex) {
					/* nothing to do at this point ... */
				}
			}
		});
	}
}

/** Returns the current logger. */
export function getLogger(): Logger {
	if (!_logger) {

		/** Single logging function to ensure we don't duplicate code deciding which environment logs what. */
		function log(level: LogLevel, ...args: any[]) {
			// ignore certain events based on environment
			if (_env === "beta") {
				if (["silly", "debug"].includes(level)) return;
			}
			if (_env === "stable") {
				if (["silly", "debug", "verbose"].includes(level)) return;
			}

			// send the args to the proper logger function
			if (level === "error") console.error(`${level}::`, ...args);
			else if (level === "warn") console.warn(`${level}::`, ...args);
			else console.log(`${level}::`, ...args);

			// send the args to any extra handlers
			_handlers.get(level)?.forEach(handler => handler(level, ...args));
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
