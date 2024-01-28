import type { AssertMode } from "../assert/AssertMode.js";
import type { LogLevelName } from "../logLevels/LogLevel.js";

/** Extra events to happen when logging at a specific level. */
let _handlers: Map<LogLevelName | AssertMode, Set<Function>>;

/** @internal Gets the handlers map or undefined. */
export function getHandlers(): Map<LogLevelName | AssertMode, Set<Function>> | undefined;

/** @internal Gets the handlers map, creating it if needed. */
export function getHandlers(create: true): Map<LogLevelName | AssertMode, Set<Function>>;

/** @internal */
export function getHandlers(create?: true): Map<LogLevelName | AssertMode, Set<Function>> | undefined {
	if (!_handlers && create) {
		_handlers = new Map();
	}
	return _handlers;
}