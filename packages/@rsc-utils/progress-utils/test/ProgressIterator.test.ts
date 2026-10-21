import { Logger, LoggerLike } from "@rsc-utils/logger-utils";
import { afterAll, afterEach, beforeAll, describe, expect, test, vitest } from "vitest";
import { ProgressIterator } from "../build/index.js";

let logger: LoggerLike;

beforeAll(() => {
	logger = Logger.init(
		{ dev:true }
	).spyOn();
});

afterEach(() => {
	// reset counts
	vitest.resetAllMocks();
});

afterAll(() => {
	// restore the spy created with spyOn
	vitest.restoreAllMocks();
});

describe("ProgressIterator", () => {

	test("Array.forEach", () => {
		const iterator = ProgressIterator.withLogger(new Array(100).fill(1), { compact:true, label:".forEach", logger });
		iterator.forEach(() => { });

		// 100 array items
		expect(logger.debug).toHaveBeenCalledTimes(100);
		// each increment 0 - 90%
		expect(logger.trace).toHaveBeenCalledTimes(11);
	});

	test("Set.forEach", () => {
		const array = [1, 1, "a", "a", "b", "b", 2, 2, "c", "c", "1", "2", "3", "4", "5"];
		const iterator = ProgressIterator.withLogger(new Set(array), { compact:true, label:".forEach", logger });
		iterator.forEach(() => { });

		// 10 set items
		expect(logger.debug).toHaveBeenCalledTimes(10);
		// each increment 0 - 90%
		expect(logger.trace).toHaveBeenCalledTimes(11);
	});

	test("Array.map", () => {
		const iterator = ProgressIterator.withLogger<number>(new Array(100).fill(1), { compact:true, label:".map", logger });
		const mapped = iterator.map((value, index) => value * index);

		// check values
		expect(mapped).toEqual(new Array(100).fill(1).map((value, index) => value * index));
		// 100 array items
		expect(logger.debug).toHaveBeenCalledTimes(100);
		// each increment 0 - 90%
		expect(logger.trace).toHaveBeenCalledTimes(11);
	});

	test("Set.map", () => {
		const array = [1, 1, "a", "a", "b", "b", 2, 2, "c", "c", "1", "2", "3", "4", "5"];
		const iterator = ProgressIterator.withLogger<number|string>(new Set(array), { compact:true, label:".map", logger });
		const mapped = iterator.map((value, index) => +value * index);

		// check values
		expect(mapped).toEqual(Array.from(new Set(array)).map((value, index) => +value * index));
		// 10 set items
		expect(logger.debug).toHaveBeenCalledTimes(10);
		// each increment 0 - 90%
		expect(logger.trace).toHaveBeenCalledTimes(11);
	});

});
