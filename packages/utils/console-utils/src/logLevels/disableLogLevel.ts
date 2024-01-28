import type { LogLevelName } from "./LogLevel.js";
import { getLogLevels } from "./getLogLevels.js";

/** Disables the given log level from actually writing to logging. */
export function disableLogLevel(...logLevels: LogLevelName[]): void {
	const _logLevels = getLogLevels();
	if (_logLevels?.size) {
		logLevels.forEach(logLevel => _logLevels.delete(logLevel));
	}
}
