
export type LogLevelName = keyof typeof LogLevel;

export enum LogLevel {
	error = 0,
	warn = 1,
	info = 2,
	http = 3,
	verbose = 4,
	debug = 5,
	silly = 6
}

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

type EnvironmentName = "development" | "test" | "production";

/**
 * Enables the given log levels to actually write to logging.
 * RSC default levels (development): enableLogLevel("silly", "debug", "verbose", "http", "info", "warn", "error").
 * RSC default levels (test): enableLogLevel("verbose", "http", "info", "warn", "error").
 * RSC default levels (production): enableLogLevel("info", "warn", "error").
 */
export function enableLogLevels(env: EnvironmentName): void {
	switch(env) {
		case "development":
			enableLogLevel("silly", "debug", "verbose", "http", "info", "warn", "error");
			break;
		case "test":
			enableLogLevel("verbose", "http", "info", "warn", "error");
			break;
		case "production":
			enableLogLevel("info", "warn", "error");
			break;
	}
}

/**
 * Enables the given log level to actually write to logging.
 */
function enableLogLevel(...logLevels: LogLevelName[]): void {
	const _logLevels = getLogLevels(true);
	logLevels.forEach(logLevel => _logLevels.add(logLevel));
}

/** Disables the given log level from actually writing to logging. */
export function disableLogLevel(...logLevels: LogLevelName[]): void {
	const _logLevels = getLogLevels();
	if (_logLevels?.size) {
		logLevels.forEach(logLevel => _logLevels.delete(logLevel));
	}
}

/** Checks to see if a given log level is enabled. */
export function isLogLevelEnabled(logLevel: LogLevelName): boolean {
	return getLogLevels()?.has(logLevel) === true;
}
