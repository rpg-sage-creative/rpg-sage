import { afterAll, afterEach, beforeAll, describe, expect, test, vitest } from "vitest";
import { GenericIterable } from "../build/index.js";
import { tagLiterals } from "@rsc-tools/dev-scripts";

const spies = {
	start: (...args: any[]) => {},
	increment: (...args: any[]) => {},
	finish: (...args: any[]) => {},
	found: (...args: any[]) => {},
	notFound: (...args: any[]) => {},
};

class SpiedOn<T> extends GenericIterable<T> {
	start(...args: any[]) { spies.start(...args); }
	increment(...args: any[]) { spies.increment(...args); }
	finish(...args: any[]) { spies.finish(...args); }
	found(...args: any[]) { spies.found(...args); }
	notFound(...args: any[]) { spies.notFound(...args); }
}

beforeAll(() => {
	for (const key of Object.keys(spies)) {
		vitest.spyOn(spies, key as keyof typeof spies);
	}
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
		const dataArray = new Array(100).fill(1);
		const iterator = SpiedOn.from(dataArray);

		const mappedValues: number[] = [];
		iterator.forEach((v, i) => mappedValues.push(v * i));

		expect(spies.start).toHaveBeenCalledTimes(1);
		expect(spies.increment).toHaveBeenCalledTimes(dataArray.length);
		expect(spies.finish).toHaveBeenCalledTimes(1);

		dataArray.forEach((v, i) => {
			expect(v * i).toBe(mappedValues[i]);
		});
	});

	test("Set.forEach", () => {
		const dataArray = [1, 1, "a", "a", "b", "b", 2, 2, "c", "c", "1", "2", "3", "4", "5"];
		const setArray = new Set(dataArray);
		const iterator = SpiedOn.from(setArray);

		const mapped: number[] = [];
		iterator.forEach((v, i) => mapped.push(+v * i));

		expect(spies.start).toHaveBeenCalledTimes(1);
		expect(spies.increment).toHaveBeenCalledTimes(setArray.size);
		expect(spies.finish).toHaveBeenCalledTimes(1);

		let i = 0;
		setArray.forEach(v => {
			isNaN(+v * i)
				? expect(+v * i).toBeNaN()
				: expect(+v * i).toBe(mapped[i]);
			i++;
		});
	});

	//#endregion

	//#region .forEachAsync() tests

	test("Array.forEachAsync", async () => {
		const dataArray = new Array(100).fill(1);
		const iterator = SpiedOn.from(dataArray);

		const mappedValues: number[] = [];
		await iterator.forEachAsync((v, i) => { mappedValues.push(v * i); });

		expect(spies.start).toHaveBeenCalledTimes(1);
		expect(spies.increment).toHaveBeenCalledTimes(dataArray.length);
		expect(spies.finish).toHaveBeenCalledTimes(1);
		dataArray.forEach((v, i) => {
			expect(v * i).toBe(mappedValues[i]);
		});
	});

	test("Set.forEachAsync", async () => {
		const dataArray = [1, 1, "a", "a", "b", "b", 2, 2, "c", "c", "1", "2", "3", "4", "5"];
		const setArray = new Set(dataArray);
		const iterator = SpiedOn.from(setArray);

		const mapped: number[] = [];
		await iterator.forEachAsync(async (v, i) => { mapped.push(+v * i); });

		expect(spies.start).toHaveBeenCalledTimes(1);
		expect(spies.increment).toHaveBeenCalledTimes(setArray.size);
		expect(spies.finish).toHaveBeenCalledTimes(1);

		let i = 0;
		setArray.forEach(v => {
			isNaN(+v * i)
				? expect(+v * i).toBeNaN()
				: expect(+v * i).toBe(mapped[i]);
			i++;
		});
	});

	//#endregion

	//#region .map() tests

	test("Array.map", () => {
		const dataArray = new Array(100).fill(1);
		const iterator = SpiedOn.from(dataArray);

		const mappedValues = iterator.map((v, i) => v * i);

		expect(spies.start).toHaveBeenCalledTimes(1);
		expect(spies.increment).toHaveBeenCalledTimes(dataArray.length);
		expect(spies.finish).toHaveBeenCalledTimes(1);

		dataArray.forEach((v, i) => {
			expect(v * i).toBe(mappedValues[i]);
		});
	});

	test("Set.map", () => {
		const dataArray = [1, 1, "a", "a", "b", "b", 2, 2, "c", "c", "1", "2", "3", "4", "5"];
		const setArray = new Set(dataArray);
		const iterator = SpiedOn.from(setArray);

		const mapped = iterator.map((v, i) => +v * i);

		expect(spies.start).toHaveBeenCalledTimes(1);
		expect(spies.increment).toHaveBeenCalledTimes(setArray.size);
		expect(spies.finish).toHaveBeenCalledTimes(1);

		let i = 0;
		setArray.forEach(v => {
			isNaN(+v * i)
				? expect(+v * i).toBeNaN()
				: expect(+v * i).toBe(mapped[i]);
			i++;
		});
	});

	describe("Array.mapFirst", () => {
		const values = [2,1,null,true];
		const tests = [
			{ callbackfn:(o:any,i:number,a:any[]) => o===2?o:undefined, expected:2 },
			{ callbackfn:(o:any,i:number,a:any[]) => o===i?o:undefined, expected:1 },
			// is value boolean
			{ callbackfn:(o:any,i:number,a:any[]) => typeof(o)==="boolean"?o:undefined, expected:true },
			// is last value in array
			{ callbackfn:(o:any,i:number,a:any[]) => i===a.length-1?o:undefined, expected:true },
			// the mapper returns true, which is defined, so we get the true instead of the 2
			{ callbackfn:(o:any,i:number,a:any[]) => o===2, expected:true },
			// even though we are returning null at index 2, null isn't defined so we wind up with undefined
			{ callbackfn:(o:any,i:number,a:any[]) => !o?o:undefined, expected:undefined },
		];
		tests.forEach(({ callbackfn, expected }) => {
			test(tagLiterals`mapFirst(${values}, ${callbackfn})`, () => {
				const output = SpiedOn.from(values).mapFirst(callbackfn as any);
				expect(output).toBe(expected);

				// as this function is map
				let foundIndex = -1;
				const hardWay = values.map(callbackfn).find((value, index) => {
					if (value !== null && value !== undefined) {
						foundIndex = index;
						return true;
					}
					return undefined;
				});
				expect(output).toBe(hardWay);

				expect(spies.start).toHaveBeenCalledTimes(1);
				expect(spies.finish).toHaveBeenCalledTimes(0);
				expect(spies.increment).toHaveBeenCalledTimes(foundIndex < 0 ? values.length : foundIndex);
				expect(spies.found).toHaveBeenCalledTimes(output !== null && output !== undefined ? 1 : 0);
				expect(spies.notFound).toHaveBeenCalledTimes(output !== null && output !== undefined ? 0 : 1);
			});
		});
	});
	test("Array.mapFirst(found)", () => {
		const dataArray = new Array(100).fill(1);
		const iterator = SpiedOn.from(dataArray);

		const mappedValue = iterator.mapFirst((v, i) => v * i === 10 ? v * i : undefined);

		expect(spies.start).toHaveBeenCalledTimes(1);
		expect(spies.increment).toHaveBeenCalledTimes(10);
		expect(spies.finish).toHaveBeenCalledTimes(0);
		expect(spies.found).toHaveBeenCalledTimes(1);
		expect(spies.notFound).toHaveBeenCalledTimes(0);

		expect(mappedValue).toBe(10);
	});

	test("Array.mapFirst(notFound)", () => {
		const dataArray = new Array(100).fill(1);
		const iterator = SpiedOn.from(dataArray);

		const mappedValue = iterator.mapFirst((v, i) => v * i === -1 ? v * i : undefined);

		expect(spies.start).toHaveBeenCalledTimes(1);
		expect(spies.increment).toHaveBeenCalledTimes(100);
		expect(spies.finish).toHaveBeenCalledTimes(0);
		expect(spies.found).toHaveBeenCalledTimes(0);
		expect(spies.notFound).toHaveBeenCalledTimes(1);

		expect(mappedValue).toBeUndefined();
	});

	//#endregion

	//#region .mapAsync() tests

	test("Array.mapAsync", async () => {
		const dataArray = new Array(100).fill(1);
		const iterator = SpiedOn.from(dataArray);

		const mappedValues = await iterator.mapAsync(async (v, i) => v * i);

		expect(spies.start).toHaveBeenCalledTimes(1);
		expect(spies.increment).toHaveBeenCalledTimes(dataArray.length);
		expect(spies.finish).toHaveBeenCalledTimes(1);

		dataArray.forEach((v, i) => {
			expect(v * i).toBe(mappedValues[i]);
		});
	});

	test("Set.mapAsync", async () => {
		const dataArray = [1, 1, "a", "a", "b", "b", 2, 2, "c", "c", "1", "2", "3", "4", "5"];
		const setArray = new Set(dataArray);
		const iterator = SpiedOn.from(setArray);

		const mapped = await iterator.mapAsync(async (v, i) => +v * i);

		expect(spies.start).toHaveBeenCalledTimes(1);
		expect(spies.increment).toHaveBeenCalledTimes(setArray.size);
		expect(spies.finish).toHaveBeenCalledTimes(1);

		let i = 0;
		setArray.forEach(v => {
			isNaN(+v * i)
				? expect(+v * i).toBeNaN()
				: expect(+v * i).toBe(mapped[i]);
			i++;
		});
	});

	//#endregion

	// find

	// findAsync

	// slice

	// forBatch

	// forBatchAsync

	// filter

	// filterAsync
});
