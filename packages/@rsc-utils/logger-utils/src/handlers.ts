import type { LogLevelName } from "./logLevels.js";

/** Extra events to happen when logging at a specific level. */
let _handlers: Map<string, Set<Function>>;

/** Gets the handlers map or undefined. */
export function getHandlers<T extends string>(): Map<T, Set<Function>> | undefined;

/** Gets the handlers map, creating it if needed. */
export function getHandlers<T extends string>(create: true): Map<T, Set<Function>>;

export function getHandlers(create?: true): Map<string, Set<Function>> | undefined {
	if (!_handlers && create) {
		_handlers = new Map();
	}
	return _handlers;
}

/** Adds an extra handler to the given logging level. */
export function addLogHandler(logLevel: LogLevelName, handler: Function): void {
	const handlers = getHandlers(true);

	if (!handlers.has(logLevel)) {
		handlers.set(logLevel, new Set());
	}

	handlers.get(logLevel)!.add(handler);
}

/** Removes the handler from all logging levels. */
export function removeLogHandler(handler: Function): void;

/** Removes the handler from the given logging level. */
export function removeLogHandler(logLevel: LogLevelName, handler: Function): void;

export function removeLogHandler(...args: (LogLevelName | Function)[]): void {
	const handlers = getHandlers();
	if (!handlers) {
		return;
	}

	const handler = args.pop() as Function;
	const logLevel = args[0] as LogLevelName;

	if (logLevel) {
		handlers.get(logLevel)?.delete(handler);
	}else {
		handlers.forEach(set => set.delete(handler));
	}
}
