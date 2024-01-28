import { isPromise } from "util/types";
import { getAssertData } from "./assert/AssertData.js";
import { startAsserting, stopAsserting } from "./assert/AssertLabel.js";
import { enableLogLevels } from "./logLevels/enableLogLevels.js";
import { error } from "./loggers/error.js";
import { info } from "./loggers/info.js";

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

async function runTest(fn: Function, exitOnFail?: boolean): Promise<void> {
	try {
		const res = fn();
		if (isPromise(res)) {
			res.catch(showSummary);
		}
		await res;
	}catch(ex) {
		showSummary(ex);
	}
	if (exitOnFail && getAssertData()?.failed) {
		process.exit(1);
	}
}

/** Convenient test process for dev/test. */
export async function runTests(...tests: Function[]): Promise<void>;
export async function runTests(exitOnFail: boolean, ...tests: Function[]): Promise<void>;
export async function runTests(...args: (boolean | Function)[]): Promise<void> {
	const exitOnFail = args.includes(true);
	const tests = args.filter((arg): arg is Function => typeof(arg) === "function");
	enableLogLevels("development");
	for (const test of tests) {
		startAsserting(test.name);
		await runTest(test, exitOnFail);
		stopAsserting();
	}
	showSummary();
}