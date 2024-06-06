
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