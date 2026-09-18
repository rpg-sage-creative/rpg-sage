import type { LogLevelName } from "./LogLevel.js";

/** All active log levels. */
let _logLevels: Set<LogLevelName>;

/** @internal Gets the log levels set or undefined. */
export function getLogLevels(): Set<LogLevelName> | undefined;

/** @internal Gets the log levels set, creating it if needed. */
export function getLogLevels(create: true): Set<LogLevelName>;

/** @internal */
export function getLogLevels(create?: true): Set<LogLevelName> | undefined {
	if (!_logLevels && create) {
		_logLevels = new Set();
	}
	return _logLevels;
}