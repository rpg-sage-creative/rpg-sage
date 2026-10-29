import { afterAll, afterEach, beforeAll, describe, expect, test, vitest } from "vitest";
import { Arrayish } from "../build/index.js";
import { tagLiterals } from "@rsc-tools/dev-scripts";

const spies = {
	start: (...args: any[]) => {},
	increment: (...args: any[]) => {},
	finish: (...args: any[]) => {},
	found: (...args: any[]) => {},
	notFound: (...args: any[]) => {},
};

class SpiedOn<T> extends Arrayish<T> {
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

describe("Arrayish", () => {

	describe(".forEach", () => {

		test("Arrayish(array).forEach", () => {
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

		test("Arrayish(set).forEach", () => {
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

	});

	describe(".map", () => {

		test("Arrayish(array).map", () => {
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

		test("Arrayish(set).map", () => {
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

	});

	describe("mapFirst", () => {
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

		test("Arrayish(array).mapFirst() --> found", () => {
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

		test("Arrayish(array).mapFirst() --> notFound", () => {
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

	});

	// find

	// findAsync

	// slice

	// forBatch

	// forBatchAsync

	// filter

	// filterAsync
});

describe("Async", () => {

	describe(".forEach", () => {

		test("Async(array).forEach", async () => {
			const dataArray = new Array(100).fill(1);
			const iterator = SpiedOn.from(dataArray);

			const mappedValues: number[] = [];
			await iterator.async().forEach((v, i) => { mappedValues.push(v * i); });

			expect(spies.start).toHaveBeenCalledTimes(1);
			expect(spies.increment).toHaveBeenCalledTimes(dataArray.length);
			expect(spies.finish).toHaveBeenCalledTimes(1);
			dataArray.forEach((v, i) => {
				expect(v * i).toBe(mappedValues[i]);
			});
		});

		test("Async(set).forEach", async () => {
			const dataArray = [1, 1, "a", "a", "b", "b", 2, 2, "c", "c", "1", "2", "3", "4", "5"];
			const setArray = new Set(dataArray);
			const iterator = SpiedOn.from(setArray);

			const mapped: number[] = [];
			await iterator.async().forEach(async (v, i) => { mapped.push(+v * i); });

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

	});

	describe(".map", () => {

		test("Async(array).map", async () => {
			const dataArray: number[] = new Array(100).fill(1);
			const iterator = SpiedOn.from(dataArray);

			const mappedValues = await iterator.async().map(async (v, i) => v * i);

			expect(spies.start).toHaveBeenCalledTimes(1);
			expect(spies.increment).toHaveBeenCalledTimes(dataArray.length);
			expect(spies.finish).toHaveBeenCalledTimes(1);

			dataArray.forEach((v, i) => {
				expect(v * i).toBe(mappedValues[i]);
			});
		});

		test("Async(set).map", async () => {
			const dataArray = [1, 1, "a", "a", "b", "b", 2, 2, "c", "c", "1", "2", "3", "4", "5"];
			const setArray = new Set(dataArray);
			const iterator = SpiedOn.from(setArray);

			const mapped = await iterator.async().map(async (v, i) => +v * i);

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

	});
});
