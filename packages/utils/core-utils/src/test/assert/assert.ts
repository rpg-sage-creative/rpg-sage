import { isDate } from "util/types";
import { isNullOrUndefined } from "../../types/index.js";
import { jsonStringify } from "../internal/jsonStringify.js";
import { incrementAssertData } from "./AssertData.js";
import { getAssertLabel } from "./AssertLabel.js";
import { getAssertMode } from "./AssertMode.js";

/** Quoting strings makes it easier to distinguish between null and "null". */
function stringify(value: any): string {
	if (isNullOrUndefined(value)) {
		return String(value);
	}
	return typeof(value) === "function"
		? `function ${value.name || "/lambda/"}`
		: jsonStringify(value);
}

/** Returns the correct prefix for logging based on the current AssertMode. */
function getAssertPrefix(value: boolean): string | undefined {
	const tab = getAssertLabel() ? "  " : "";
	const indicator = value ? "pass" : "fail";
	const colorCode = value ? 32 : 31;
	const prefix = `\x1b[${colorCode}m${tab}assert-${indicator}::\x1b[0m`;
	const mode = getAssertMode();
	switch(mode) {
		case "pass": return value ? prefix : undefined;
		case "fail": return !value ? prefix : undefined;
		case "both": return prefix;
		default: return undefined;
	}
}

/**
 * Compares the given values by checking types for date/array/object.
 * Dates are compared using getTime().
 * Arrays are compared recursively by checking length before iterating.
 * Objects are compared using JSON.stringify().
 */
function compareValues(expected: unknown, actual: unknown): boolean {
	if (expected === actual) {
		return true;
	}
	if (isDate(expected) && isDate(actual)) {
		return expected.getTime() === actual.getTime();
	}
	if (Array.isArray(expected) && Array.isArray(actual)) {
		if (expected.length !== actual.length) {
			return false;
		}
		return expected.every((v, i) => compareValues(v, actual[i]));
	}
	if (typeof(expected) === "object" && typeof(actual) === "object") {
		return jsonStringify(expected) === jsonStringify(actual);
	}
	return false;
}

/** Processes the assert logic shared between assert and assertAsync. */
function _assert(expectedValue: unknown, fnName: string, actualValue: unknown, args: unknown[]): void {
	const compareResults = compareValues(expectedValue, actualValue);
	incrementAssertData(compareResults);
	const assertLabel = getAssertPrefix(compareResults);
	if (assertLabel) {
		const argsString = args.map(arg => stringify(arg)).join(",");
		const actualString = stringify(actualValue);
		const expectedString = stringify(expectedValue);
		const output = `${fnName}(${argsString}) => ${actualString} !== ${expectedString}`;
		console.log(assertLabel, output);
	}

}

/**
 * A convenience method for using console.assert.
 * The callback method is called with all the given args and compared to the expected value.
 * The output for a failure is created to show the function name, args, and result as well as the expected value.
 */
export function assert<T>(expectedValue: T, callbackfn: Function, ...args: any[]): void;

/**
 * A passthrough for console.assert that allows tracking AssertData and
 */
export function assert<T>(testValue: boolean, ...valuesToLog: any[]): void;

export function assert(..._args: any[]): void {
	const callbackfn = typeof(_args[1]) === "function" ? _args[1] : null;
	if (callbackfn) {
		const args = _args.slice(2);
		const expectedValue = _args[0];
		const actualValue = callbackfn(...args);
		_assert(expectedValue, callbackfn.name || "/lambda/", actualValue, args);

	}else {
		const assertBool = _args[0];
		const args = _args.slice(1);
		incrementAssertData(assertBool);
		const assertLabel = getAssertPrefix(assertBool);
		if (assertLabel) {
			console.log(assertLabel, ...args);
		}
	}
}

/**
 * A convenience method for using console.assert.
 * The callback method is called with all the given args and compared to the expected value.
 * The output for a failure is created to show the function name, args, and result as well as the expected value.
 */
export async function assertAsync<T>(expectedValue: T, callbackfn: Function, ...args: any[]): Promise<void> {
	const actualValue = await callbackfn(...args);
	_assert(expectedValue, callbackfn.name || "/lambda/", actualValue, args);
}