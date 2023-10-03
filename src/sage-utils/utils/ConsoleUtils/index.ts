import { appendFile } from "fs";
import { getDateStrings } from "../DateUtils";
import { LogLevel } from "./enums";
import { getLogger } from "./logger";
import type { TConsoleHandler } from "./types";

export * as Catchers from "./Catchers";
export * from "./logger";

//#region Console

/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/console) */
interface Console {
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/assert) */
    assert(condition?: boolean, ...data: any[]): void;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/clear) */
    clear(): void;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/count) */
    count(label?: string): void;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/countReset) */
    countReset(label?: string): void;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/debug) */
    debug(...data: any[]): void;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/dir) */
    dir(item?: any, options?: any): void;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/dirxml) */
    dirxml(...data: any[]): void;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/error) */
    error(...data: any[]): void;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/group) */
    group(...data: any[]): void;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/groupCollapsed) */
    groupCollapsed(...data: any[]): void;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/groupEnd) */
    groupEnd(): void;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/info) */
    info(...data: any[]): void;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/log) */
    log(...data: any[]): void;
	silly(...args: any[]): void;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/table) */
    table(tabularData?: any, properties?: string[]): void;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/time) */
    time(label?: string): void;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/timeEnd) */
    timeEnd(label?: string): void;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/timeLog) */
    timeLog(label?: string, ...data: any[]): void;
    timeStamp(label?: string): void;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/trace) */
    trace(...data: any[]): void;
	verbose(...args: any[]): void;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/warn) */
    warn(...data: any[]): void;
}

declare var console: Console;

if (!console.silly) console.silly = console.log;
if (!console.verbose) console.verbose = console.log;

//#endregion

let _consoleHandler: TConsoleHandler;
export function setConsoleHandler(consoleHandler: TConsoleHandler): void;
export function setConsoleHandler(consoleHandler: TConsoleHandler, logDir: string): void;
export function setConsoleHandler(consoleHandler: TConsoleHandler, logDir: string, logToConsole: boolean): void;
export function setConsoleHandler(consoleHandler: TConsoleHandler, logDir?: string, logToConsole?: boolean): void {
	// Set the handler
	_consoleHandler = consoleHandler;

	// If we have a logDir, set it and turn off console logging
	setLogDir(logDir ?? _logDir);

	// If we have a new console logging flag, set it
	setLogToConsole(logToConsole ?? _logToConsole);
}

let _logLevel: LogLevel | undefined;
export function setLogLevel(logLevel: LogLevel): void {
	_logLevel = logLevel;
}

let _logDir: string | undefined;
export function setLogDir(logDir?: string): void {
	_logDir = logDir ?? undefined;
}

let _logToConsole = true;
export function setLogToConsole(logToConsole: boolean): void {
	_logToConsole = logToConsole;
}

type TFunctionMap = { [key: string]: Function; };
const originals: TFunctionMap = { };

function passThrough(logLevel: LogLevel, functionName: string, ...args: any[]) {
	// If we have a handler, send the log info there as well
	if (_consoleHandler) {
		_consoleHandler(logLevel, ...args);
	}

	// No log level; all written to console or file
	if (_logLevel === undefined) {
		// if we have a logDir
		logToFile(logLevel, args);

		// if we want console or we don't have a logDir
		if (_logToConsole || !_logDir) {
			getLogger().log(functionName as "error", ...args);
		}

	// Log level; make sure we want it logged
	}else if (_logLevel >= logLevel) {
		// if we have a log path, write to the file
		logToFile(logLevel, args);

		// if we are logging to console, write everything
		if (_logToConsole) {
			getLogger().log(functionName as "error", ...args);
		}
	}
}

/** File logging helper for formatting Error objects. */
export function formatArg(arg: any): string {
	if (arg instanceof Error) {
		if (arg.stack) {
			return arg.stack;
		}
		return arg.message ? `${arg.name}: ${arg.message}` : arg.name;
	}
	return String(arg);
}

/** Logs the args to file if we have a folder to log to. */
function logToFile(logLevel: LogLevel, args: any[]): void {
	if (_logDir) {
		const now = getDateStrings();
		const fileName = `${_logDir}/${now.date}.log`;
		const lines = args.map(arg => `${now.date}T${now.time}: ${LogLevel[logLevel].toLowerCase()}:: ${formatArg(arg)}`).concat("").join("\n");
		appendFile(fileName, lines, error => {
			if (error) {
				try {
					originals["error"].apply(console, ["Unable to log to file!", error]);
				}catch(ex) {
					/* nothing to do at this point ... */
				}
			}
		});
	}
}

export function startHandling(logLevel: LogLevel) {
	setLogLevel(logLevel ?? _logLevel);
	const logLevelNumbers = Object.keys(LogLevel).filter(key => isFinite(+key)).map(key => +key);
	const firstLogLevel = Math.min(...logLevelNumbers);
	const lastLogLevel = Math.max(...logLevelNumbers);
	for (let level = firstLogLevel; level <= lastLogLevel; level++) {
		const functionName = LogLevel[level][0].toLowerCase() + LogLevel[level].slice(1);
		originals[functionName] = (console as unknown as TFunctionMap)[functionName];
		(console as unknown as TFunctionMap)[functionName] = passThrough.bind(console, level, functionName);
	}
}

export function stopHandling() {
	Object.keys(originals).forEach(key => {
		(console as unknown as TFunctionMap)[key] = originals[key];
		delete originals[key];
	});
}
