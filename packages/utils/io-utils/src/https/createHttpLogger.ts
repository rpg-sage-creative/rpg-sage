import { error, http } from "@rsc-utils/core-utils";
import { ProgressTracker } from "@rsc-utils/progress-utils";

/** @internal */
export function createHttpLogger(label: string, total?: number, interval?: number): ProgressTracker {
	const tracker = new ProgressTracker(label, total, interval);
	tracker.on("status", evData => http(evData.message));
	tracker.on("error", evData => error(evData.message));
	return tracker;
}