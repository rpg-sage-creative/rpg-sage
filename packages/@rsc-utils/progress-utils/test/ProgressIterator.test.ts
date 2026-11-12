import { Logger, LoggerLike } from "@rsc-utils/logger-utils";
import { afterAll, afterEach, beforeAll, describe, expect, test, vitest } from "vitest";
import { ProgressIterator, ProgressTracker } from "../build/index.js";

let logger: LoggerLike;

beforeAll(() => {
	logger = Logger.init(
		// { dev:true }
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

	/** helper async function that returns Promise<boolean> to determine if a number is odd or not */
	function odd(index: number, ms = 100, ret = true) {
		if (index % 2 == 1) return;
		return new Promise(res => { setTimeout(res, ms, ret); });
	}

describe("ProgressIterator", () => {

	//#region .forEach() tests

	test("Array.forEach", () => {
		const iterator = ProgressIterator.withLogger(new Array(100).fill(1), { compact:true, label:"Array.forEach", logger });
		iterator.forEach(() => { });

		// each increment 0 - 100%
		expect(logger.info).toHaveBeenCalledTimes(13); // start, increments, finish
	});

	test("Array.forEach - verbose", () => {
		const iterator = ProgressIterator.withLogger(new Array(100).fill(1), { compact:true, label:"Array.forEach", logger, verbose:true });
		iterator.forEach(() => { });

		// each increment 0 - 100%
		expect(logger.trace).toHaveBeenCalledTimes(100);
		// standard invtervals plus start/finish
		expect(logger.info).toHaveBeenCalledTimes(13);
	});

	test("Set.forEach", () => {
		const array = [1, 1, "a", "a", "b", "b", 2, 2, "c", "c", "1", "2", "3", "4", "5"];
		const iterator = ProgressIterator.withLogger(new Set(array), { compact:true, label:"Set.forEach", logger });
		iterator.forEach(() => { });

		// each increment 0 - 100%
		expect(logger.info).toHaveBeenCalledTimes(13); // start, increments, finish
	});

	//#endregion

	//#region .forEachAsync() tests

	test("Array.forEachAsync", async () => {
		const array = ["one", "two", "three"];
		const iterator = ProgressIterator.withLogger(array, { compact:true, label:"Array.forEachAsync", logger });

		const output: string[] = [];
		await iterator.forEachAsync(async (val, index, _arr) => {
			await odd(index);
			output.push(val.toUpperCase());
		});

		// check values
		expect(output).toStrictEqual(["ONE", "TWO", "THREE"]);
		// 0%, 100%; (with 3 items we will never see another increment divisible by 10)
		expect(logger.info).toHaveBeenCalledTimes(4); // start, 0%, 100%, finish
	});


	//#endregion

	//#region .map() tests

	test("Array.map", () => {
		const iterator = ProgressIterator.withLogger(new Array(100).fill(1), { compact:true, label:"Array.map", logger });
		const mapped = iterator.map((value, index) => value * index);

		// check values
		expect(mapped).toEqual(new Array(100).fill(1).map((value, index) => value * index));
		// each increment 0 - 100%
		expect(logger.info).toHaveBeenCalledTimes(13); // start, increments, finish
	});

	test("Set.map", () => {
		const array = [1, 1, "a", "a", "b", "b", 2, 2, "c", "c", "1", "2", "3", "4", "5"];
		const iterator = ProgressIterator.withLogger<number|string>(new Set(array), { compact:true, label:"Set.map", logger });
		const mapped = iterator.map((value, index) => +value * index);

		// check values
		expect(mapped).toEqual(Array.from(new Set(array)).map((value, index) => +value * index));
		// each increment 0 - 100%
		expect(logger.info).toHaveBeenCalledTimes(13); // start, increments, finish
	});

	//#endregion

	//#region .mapAsync() tests

	test("Array.mapAsync", async () => {
		const array = ["one", "two", "three"];
		const iterator = ProgressIterator.withLogger(array, { compact:true, label:"Array.mapAsync", logger });

		const output = await iterator.mapAsync(async (val, index, _arr) => {
			await odd(index);
			return `${val}-${val}`.toUpperCase();
		});

		// check values
		expect(output).toStrictEqual(["ONE-ONE", "TWO-TWO", "THREE-THREE"]);
		// 0%, 100%; (with 3 items we will never see another increment divisible by 10)
		expect(logger.info).toHaveBeenCalledTimes(4); // start, 0%, 100%, finish
	});

	test("Set.mapAsync", async () => {
		const array = ["one", "two", "three", "one", "two", "three"];
		const iterator = ProgressIterator.withLogger(new Set(array), { compact:true, label:"Set.mapAsync", logger });

		const output = await iterator.mapAsync(async (val, index, _arr) => {
			await odd(index);
			return `${val}-${val}`.toUpperCase();
		});

		// check values
		expect(output).toStrictEqual(["ONE-ONE", "TWO-TWO", "THREE-THREE"]);
		// 0%, 100%; (with 3 items we will never see another increment divisible by 10)
		expect(logger.info).toHaveBeenCalledTimes(4); // start, 0%, 100%, finish
	});

	//#endregion

	//#region constructor and tracker variants

	test(`new ProgressIterator() has no tracker but still iterates`, () => {
		const iterator = new ProgressIterator([1, 2, 3]);
		expect(iterator.tracker).toBe(undefined);
		const output: number[] = [];
		iterator.forEach(value => output.push(value));
		expect(output).toEqual([1, 2, 3]);
	});

	test(`forEach passes thisArg to the callback`, () => {
		const seen: unknown[] = [];
		new ProgressIterator([1, 2]).forEach(function(this:{ tag:string }, value){ seen.push([value, this.tag]); }, { tag:`T` });
		expect(seen).toEqual([[1, `T`], [2, `T`]]);
	});

	test(`map passes thisArg to the callback`, () => {
		const mapped = new ProgressIterator([1, 2]).map(function(this:{ factor:number }, value){ return value * this.factor; }, { factor:10 });
		expect(mapped).toEqual([10, 20]);
	});

	test(`withTracker drives the given tracker through forEach`, () => {
		const tracker = new ProgressTracker({ label:"wt", total:3 });
		const iterator = ProgressIterator.withTracker([`a`, `b`, `c`], tracker);
		expect(iterator.tracker).toBe(tracker);
		iterator.forEach(() => { });
		expect(tracker.countComplete).toBe(3);
		expect(tracker.finished).toBe(true);
	});

	test(`an empty iterable logs start/finish failures and no progress`, () => {
		const error = vitest.fn();
		const info = vitest.fn();
		const iterator = ProgressIterator.withLogger([], { compact:true, label:"empty", logger:{ error, info } });
		iterator.forEach(() => { });
		expect(info).toHaveBeenCalledTimes(0);
		expect(error).toHaveBeenCalledTimes(2);
		expect(String(error.mock.calls[0][0])).toContain(`Start Failed: Invalid Total (0)`);
		expect(String(error.mock.calls[1][0])).toContain(`Finish Failed: Not Started!`);
	});

	//#endregion

});
