import { LogLevelName } from "../logLevels/LogLevel.js";
import { isColorLevelEnabled } from "./isColorLevelEnabled.js";

/** Returns the color code for the log level only if enabled. */
function getColorCode(logLevel: LogLevelName): number | undefined {
	if (isColorLevelEnabled(logLevel)) {
		switch(logLevel) {
			case "error": return 31;
			case "warn": return 33;
			default: return undefined;
		}
	}
	return undefined;
}

/** Wraps the prefix in the color code if one is found. */
export function colorPrefix(logLevel: LogLevelName): string {
	const colorCode = getColorCode(logLevel);
	if (colorCode !== undefined) {
		return `\x1b[${colorCode}m${logLevel}::\x1b[0m`;
	}
	return logLevel + "::";
}
