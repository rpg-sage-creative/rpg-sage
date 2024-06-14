import { isPromise } from "util/types";
import { enableColorLevels } from "../console/colors/enableColorLevels.js";
import { error } from "../console/loggers/error.js";
import { info } from "../console/loggers/info.js";
import { enableLogLevels } from "../console/logLevels/enableLogLevels.js";
import { getAssertData } from "./assert/AssertData.js";
import { startAsserting, stopAsserting } from "./assert/AssertLabel.js";

function showSummary(ex?: unknown) {
	if (ex) {
		error(ex);
	}
	// blank line
	info();
	info(getAssertData());
	if (ex) {
		process.exit(1);
	}
}

/** Convenient test process for dev/test. */
export async function runTests(testFn: Function, exitOnFail?: boolean, ...args: unknown[]): Promise<void> {
	enableColorLevels("development");
	enableLogLevels("development");
	startAsserting(testFn.name);
	try {
		const res = testFn(...args);
		if (isPromise(res)) {
			res.catch(showSummary);
		}
		await res;
	}catch(ex) {
		showSummary(ex);
	}
	stopAsserting();
	if (exitOnFail && getAssertData()?.failed) {
		process.exit(1);
	}
	showSummary();
}