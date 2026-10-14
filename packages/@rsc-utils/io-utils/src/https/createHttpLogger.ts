import { error, ProgressTracker, trace } from "@rsc-utils/core-utils";

/** @internal */
export function createHttpLogger(label: string, total?: number, interval?: number): ProgressTracker {
	const tracker = new ProgressTracker(label, total, interval);
	tracker.on("status", evData => trace(evData.message));
	tracker.on("error", evData => error(evData.message));
	return tracker;
}