import type { LogLevelName } from "../logLevels/LogLevel.js";

/** All log levels we are coloring. */
let _colorLevels: Set<LogLevelName>;

/** @internal Gets the color levels set or undefined. */
export function getColorLevels(): Set<LogLevelName> | undefined;

/** @internal Gets the color levels set, creating it if needed. */
export function getColorLevels(create: true): Set<LogLevelName>;

/** @internal */
export function getColorLevels(create?: true): Set<LogLevelName> | undefined {
	if (!_colorLevels && create) {
		_colorLevels = new Set();
	}
	return _colorLevels;
}