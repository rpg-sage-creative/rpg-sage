import type { LogLevelName } from "../logLevels/LogLevel.js";
import { getHandlers } from "./getHandlers.js";

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
