import { error, verbose } from "@rsc-utils/core-utils";
import { ProgressTracker } from "./ProgressTracker.js";

/**
 * A simple subclass of ProgressTracker that logs status events to verbose and error events to error.
 */
export class PercentLogger extends ProgressTracker {

	public constructor(label: string, total?: number, interval?: number) {
		super(label, total, interval);
		this.on("status", evData => verbose(evData.message));
		this.on("error", evData => error(evData.message));
	}

}