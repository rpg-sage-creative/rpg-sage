import type { LogLevelName } from "./LogLevel.js";
import { getLogLevels } from "./getLogLevels.js";

/** @internal Checks to see if a given log level is enabled. */
export function isLogLevelEnabled(logLevel: LogLevelName): boolean {
	return getLogLevels()?.has(logLevel) === true;
}