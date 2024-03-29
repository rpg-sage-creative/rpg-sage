import { getHandlers } from "@rsc-utils/console-utils";
import type { AssertMode } from "../assert/AssertMode.js";

/** Adds an extra handler to the given assert mode. */
export function addAssertHandler(assertMode: AssertMode, handler: Function): void {
	const handlers = getHandlers(true);

	if (!handlers.has(assertMode)) {
		handlers.set(assertMode, new Set());
	}

	handlers.get(assertMode)!.add(handler);
}
