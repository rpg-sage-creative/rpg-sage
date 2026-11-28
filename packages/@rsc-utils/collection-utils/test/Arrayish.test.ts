import { randomInt } from "node:crypto";
import { isDefined } from "@rsc-utils/type-utils";
import { afterAll, afterEach, beforeAll, describe, expect, test, vitest } from "vitest";
import { Arrayish, toUnique } from "../build/index.js";

const spies = {
	start: (...args: any[]) => {},
	increment: (...args: any[]) => {},
	filtered: (...args: any[]) => {},
	finish: (...args: any[]) => {},
	found: (...args: any[]) => {},
	notFound: (...args: any[]) => {},
};

class SpiedOn<T> extends Arrayish<T> {
	start(...args: any[]) { spies.start(...args); }
	increment(...args: any[]) { spies.increment(...args); }
	filtered(...args: any[]) { spies.filtered(...args); }
	finish(...args: any[]) { spies.finish(...args); }
	found(...args: any[]) { spies.found(...args); }
	notFound(...args: any[]) { spies.notFound(...args); }
}

async function sleep(ms: number): Promise<void> {
	return await new Promise(res => setTimeout(res, ms ?? 0));
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

function evenValue(v: number) { return v % 2 === 0; }

describe("Arrayish", () => {

	describe("statics and construction", () => {

		test("Arrayish.from returns a base Arrayish (no events)", () => {
			const iterator = Arrayish.from([1, 2]);
			expect(iterator).toBeInstanceOf(Arrayish);
			iterator.forEach(() => {});
			expect(spies.start).toHaveBeenCalledTimes(0);
			expect(spies.finish).toHaveBeenCalledTimes(0);
		});

		test("SpiedOn.from uses the `this ?? Arrayish` static to build the SUBCLASS, so events fire", () => {
			const iterator = SpiedOn.from([1]);
			expect(iterator).toBeInstanceOf(SpiedOn);
			iterator.forEach(() => {});
			expect(spies.start).toHaveBeenCalledTimes(1);
			expect(spies.finish).toHaveBeenCalledTimes(1);
		});

		test("static Arrayish.async does NOT attach events (no source instance to copy from)", async () => {
			await Arrayish.async([1, 2]).forEach(() => {});
			expect(spies.start).toHaveBeenCalledTimes(0);
			expect(spies.increment).toHaveBeenCalledTimes(0);
			expect(spies.finish).toHaveBeenCalledTimes(0);
		});

		test("static Arrayish.parallel does NOT attach events", async () => {
			await Arrayish.parallel([1, 2], { concurrency: 2 }).forEach(() => {});
			expect(spies.start).toHaveBeenCalledTimes(0);
			expect(spies.finish).toHaveBeenCalledTimes(0);
		});

		test("instance .async() attaches the source's event methods (attachEvents)", async () => {
			await SpiedOn.from([1, 2]).async().forEach(() => {});
			expect(spies.start).toHaveBeenCalledTimes(1);
			expect(spies.increment).toHaveBeenCalledTimes(2);
			expect(spies.finish).toHaveBeenCalledTimes(1);
		});

		test("instance .parallel() attaches the source's event methods (attachEvents)", async () => {
			await SpiedOn.from([1, 2]).parallel().forEach(() => {});
			expect(spies.start).toHaveBeenCalledTimes(1);
			expect(spies.increment).toHaveBeenCalledTimes(2);
			expect(spies.finish).toHaveBeenCalledTimes(1);
		});

	});

	describe("type flags and length", () => {

		test("array input: isArray=true, isSet=false, isArrayLike=false; length from .length", () => {
			const iterator = Arrayish.from([1, 2, 3]);
			expect(iterator.isArray).toBe(true);
			expect(iterator.isSet).toBe(false);
			expect(iterator.isArrayLike).toBe(false);
			expect(iterator.length).toBe(3);
		});

		test("set input: isSet=true; length from .size", () => {
			const iterator = Arrayish.from(new Set([1, 2]));
			expect(iterator.isArray).toBe(false);
			expect(iterator.isSet).toBe(true);
			expect(iterator.isArrayLike).toBe(false);
			expect(iterator.length).toBe(2);
		});

		test("arraylike object input: isArrayLike=true; length from .length", () => {
			const iterator = Arrayish.from({ 0:"a", 1:"b", length:2 });
			expect(iterator.isArray).toBe(false);
			expect(iterator.isSet).toBe(false);
			expect(iterator.isArrayLike).toBe(true);
			expect(iterator.length).toBe(2);
		});

		test("toArray copies arrays (never returns the same reference)", () => {
			const input = [1, 2];
			const output = Arrayish.from(input).toArray();
			expect(output).toStrictEqual([1, 2]);
			expect(output).not.toBe(input);
		});

		test("toArray on an arraylike object converts via Array.from — holes become undefined", () => {
			// Array.from({ length:3 }) yields three undefined values; indexed holes are preserved as undefined too
			expect(Arrayish.from({ 0:"a", length:3 }).toArray()).toStrictEqual(["a", undefined, undefined]);
		});

		test("toSet dedupes array input", () => {
			expect([...Arrayish.from([1, 1, 2]).toSet()]).toStrictEqual([1, 2]);
		});

	});

	describe(".filter", () => {

		test("(array).filter keeps truthy values and fires filtered(index) per KEPT item only", () => {
			const iterator = SpiedOn.from([1, 2, 3]);
			const output = iterator.filter(v => v > 1);

			expect(output).toStrictEqual([2, 3]);
			expect(spies.start).toHaveBeenCalledTimes(1);
			// filtered fires with the item's own index, only for kept items
			expect(spies.filtered).toHaveBeenCalledTimes(2);
			expect(spies.filtered).toHaveBeenNthCalledWith(1, 1);
			expect(spies.filtered).toHaveBeenNthCalledWith(2, 2);
			// increment fires for EVERY item (kept or not), with no count argument
			expect(spies.increment).toHaveBeenCalledTimes(3);
			expect(spies.increment).toHaveBeenCalledWith();
			expect(spies.finish).toHaveBeenCalledTimes(1);
		});

		test("(set).filter iterates set insertion order", () => {
			const output = Arrayish.from(new Set([1, 2, 3])).filter(v => v % 2 === 1);
			expect(output).toStrictEqual([1, 3]);
		});

		test("(array).filter passes thisArg to the predicate", () => {
			const ctx = { min: 1 };
			const output = Arrayish.from([1, 2]).filter(function(this: { min:number }, v) { return v > this.min; }, ctx);
			expect(output).toStrictEqual([2]);
		});

		test("(array).filter with no matches returns [] and never fires filtered", () => {
			const iterator = SpiedOn.from([1, 2]);
			expect(iterator.filter(() => false)).toStrictEqual([]);
			expect(spies.filtered).toHaveBeenCalledTimes(0);
			expect(spies.increment).toHaveBeenCalledTimes(2);
			expect(spies.finish).toHaveBeenCalledTimes(1);
		});

	});

	describe(".filterAndMap", () => {

		test(`(array).filterAndMap --> "\${val}-\${val}"`, () => {
			const input = [2,1,null,"2",true,null,undefined,2,null,"1",1,false,true];
			const expected = [
				'2-2',
				'1-1',
				'null-null',
				'2-2',
				'true-true',
				'undefined-undefined',
				'1-1',
				'false-false'
			];
			const output = Arrayish.from(input).filterAndMap(toUnique, val => `${val}-${val}`);
			expect(output).toStrictEqual(expected);
		});

		test("(array).filterAndMap --> square the evens", () => {
			// numbers 0 - 9
			const dataArray = Array.from({ length:10 }, (_, i) => i);
			const iterator = SpiedOn.from(dataArray);

			// square the even values
			const mappedValues = iterator.filterAndMap(evenValue, v => v * v);
			expect(mappedValues).toEqual([0,4,16,36,64]);
		});

		test("(array).filterAndMap maps with the ORIGINAL index of kept items in a single pass", () => {
			const iterator = SpiedOn.from(["a","b","c"]);
			const output = iterator.filterAndMap((_, i) => i !== 1, (v, i) => `${v}@${i}`);

			// "b" is skipped; "c" keeps its original index 2
			expect(output).toStrictEqual(["a@0", "c@2"]);
			expect(spies.filtered).toHaveBeenCalledTimes(2);
			expect(spies.increment).toHaveBeenCalledTimes(3);
		});

		test("(array).filterAndMap passes thisArg to BOTH the predicate and the mapper", () => {
			const ctx = { t: "!" };
			const output = Arrayish.from([1, 2])
				.filterAndMap(function() { return true; }, function(this: { t:string }, v) { return `${v}${this.t}`; }, ctx);
			expect(output).toStrictEqual(["1!", "2!"]);
		});

	});

	describe(".find", () => {

		test("(array).find fires found(index) with the matched item's index and skips finish", () => {
			const iterator = SpiedOn.from(["a","b","c"]);
			const output = iterator.find(v => v === "b");

			expect(output).toBe("b");
			expect(spies.start).toHaveBeenCalledTimes(1);
			// increment fires only for items BEFORE the match (index 0)
			expect(spies.increment).toHaveBeenCalledTimes(1);
			expect(spies.found).toHaveBeenCalledTimes(1);
			expect(spies.found).toHaveBeenCalledWith(1);
			expect(spies.notFound).toHaveBeenCalledTimes(0);
			// a found result never fires finish
			expect(spies.finish).toHaveBeenCalledTimes(0);
		});

		test("(array).find with no match fires notFound and returns undefined", () => {
			const iterator = SpiedOn.from(["a","b"]);
			const output = iterator.find(v => v === "z");

			expect(output).toBeUndefined();
			expect(spies.increment).toHaveBeenCalledTimes(2);
			expect(spies.found).toHaveBeenCalledTimes(0);
			expect(spies.notFound).toHaveBeenCalledTimes(1);
		});

		test("(array).find passes thisArg to the predicate", () => {
			const ctx = { want: 2 };
			const output = Arrayish.from([1, 2]).find(function(this: { want:number }, v) { return v === this.want; }, ctx);
			expect(output).toBe(2);
		});

		test("(set).find iterates set insertion order", () => {
			const output = Arrayish.from(new Set(["a","b"])).find(v => v === "b");
			expect(output).toBe("b");
		});

	});

	describe(".forBatch", () => {

		test("(array).forBatch splits into batches and fires increment(batchLength)", () => {
			const iterator = SpiedOn.from([1, 2, 3, 4, 5]);
			const batches: number[][] = [];
			const startIndexes: number[] = [];
			iterator.forBatch(2, (batch, startIndex) => {
				batches.push(batch);
				startIndexes.push(startIndex);
			});

			expect(batches).toStrictEqual([[1, 2], [3, 4], [5]]);
			expect(startIndexes).toStrictEqual([0, 2, 4]);
			expect(spies.start).toHaveBeenCalledTimes(1);
			// unlike the other methods, forBatch passes the batch length to increment
			expect(spies.increment).toHaveBeenCalledTimes(3);
			expect(spies.increment).toHaveBeenNthCalledWith(1, 2);
			expect(spies.increment).toHaveBeenNthCalledWith(2, 2);
			expect(spies.increment).toHaveBeenNthCalledWith(3, 1);
			expect(spies.finish).toHaveBeenCalledTimes(1);
		});

		test("(array).forBatch with batchSize=0 never invokes the callback (empty batch ends the loop)", () => {
			const iterator = SpiedOn.from([1, 2, 3]);
			const batches: number[][] = [];
			iterator.forBatch(0, batch => batches.push(batch));

			expect(batches).toStrictEqual([]);
			expect(spies.increment).toHaveBeenCalledTimes(0);
			expect(spies.finish).toHaveBeenCalledTimes(1);
		});

		test("QUIRK: (array).forBatch with a NEGATIVE batchSize slices from the end — [1..5] at -2 yields one batch [1,2,3] and silently drops 4 and 5", () => {
			const batches: number[][] = [];
			Arrayish.from([1, 2, 3, 4, 5]).forBatch(-2, batch => batches.push(batch));

			// slice(0, -2) -> [1,2,3]; next slice(3, 1) is empty and ends the loop
			expect(batches).toStrictEqual([[1, 2, 3]]);
		});

		test("(array).forBatch with batchSize > length yields a single batch", () => {
			const batches: number[][] = [];
			Arrayish.from([1, 2, 3]).forBatch(10, batch => batches.push(batch));
			expect(batches).toStrictEqual([[1, 2, 3]]);
		});

		test("(set).forBatch converts the set to an array first", () => {
			const batches: string[][] = [];
			Arrayish.from(new Set(["a","b","c"])).forBatch(2, batch => batches.push(batch));
			expect(batches).toStrictEqual([["a","b"], ["c"]]);
		});

		test("(array).forBatch passes thisArg and the original iterableLike to the callback", () => {
			const input = [1, 2];
			const ctx = { t: "!" };
			let seenIterableLike: unknown;
			Arrayish.from(input).forBatch(5, function(this: { t:string }, batch, startIndex, iterableLike) {
				seenIterableLike = iterableLike;
				expect(this.t).toBe("!");
				expect(startIndex).toBe(0);
			}, ctx);
			// the callback receives the ORIGINAL reference, not the internal copy
			expect(seenIterableLike).toBe(input);
		});

	});

	describe(".forEach", () => {

		test("(array).forEach", () => {
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

		test("(set).forEach", () => {
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

		test("(arraylike object).forEach iterates Array.from output — indexed holes read as undefined", () => {
			const values: unknown[] = [];
			Arrayish.from({ 0:"a", length:3 }).forEach(v => values.push(v));
			expect(values).toStrictEqual(["a", undefined, undefined]);
		});

		test("(array).forEach passes thisArg to the callback", () => {
			const ctx = { t: "!" };
			const out: string[] = [];
			Arrayish.from([1, 2]).forEach(function(this: { t:string }, v, i) { out.push(`${v}${i}${this.t}`); }, ctx);
			expect(out).toStrictEqual(["10!", "21!"]);
		});

		test("QUIRK: (array with holes).forEach visits holes as undefined — native Array#forEach skips them entirely", () => {
			const seen: [number, unknown][] = [];
			Arrayish.from([0, 1,, 3,, 5]).forEach((v, i) => seen.push([i, v]));

			// all six indexes are visited; the hole slots arrive as undefined
			expect(seen.length).toBe(6);
			expect(seen[2]).toStrictEqual([2, undefined]);
			expect(seen[4]).toStrictEqual([4, undefined]);

			const nativeSeen: number[] = [];
			[0, 1,, 3,, 5].forEach((_, i) => nativeSeen.push(i));
			expect(nativeSeen).toStrictEqual([0, 1, 3, 5]);
		});

	});

	describe(".map", () => {

		test("(array).map", () => {
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

		test("(set).map", () => {
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

		test("(array).map passes thisArg to the callback", () => {
			const ctx = { t: "!" };
			expect(Arrayish.from([1, 2]).map(function(this: { t:string }, v) { return `${v}${this.t}`; }, ctx)).toStrictEqual(["1!", "2!"]);
		});

		test("QUIRK: (array with holes).map visits holes as undefined and produces NaN entries — DENSE output, unlike native Array#map which skips holes and preserves them", () => {
			// holey literals infer (number|undefined)[]; asserted number[] — how a real caller would hand Arrayish a "typed" sparse array whose holes still arrive as undefined
			const input = [0, 1,, 3,, 5] as number[];
			const output = Arrayish.from(input).map(n => n * n);

			expect(output.length).toBe(6);
			// every slot is an own enumerable key — no holes survive; the hole slots hold NaN (undefined * undefined)
			expect(Object.keys(output)).toStrictEqual(["0", "1", "2", "3", "4", "5"]);
			expect(output[2]).toBeNaN();
			expect(output[4]).toBeNaN();

			// native Array#map skips holes and preserves them in the result — Arrayish does not
			const native = input.map(n => n * n);
			expect(2 in output).toBe(true);
			expect(2 in native).toBe(false);
		});

	});

	describe(".mapFirst", () => {

		test("(array).mapFirst() --> found fires with the index and skips finish", () => {
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

		test("(array).mapFirst() --> notFound after a full pass", () => {
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

		// the six cases below were a table-driven loop; values are [2, 1, null, true]
		const mapFirstValues = [2,1,null,true];

		test("(array).mapFirst --> first DEFINED mapped value wins (o===2 returns 2 at index 0)", () => {
			const output = SpiedOn.from(mapFirstValues).mapFirst(o => o === 2 ? o : undefined);
			expect(output).toBe(2);
			expect(spies.found).toHaveBeenCalledTimes(1);
			expect(spies.increment).toHaveBeenCalledTimes(0);
		});

		test("(array).mapFirst --> value===index matches at index 1 (1)", () => {
			const output = SpiedOn.from(mapFirstValues).mapFirst((o, i) => o === i ? o : undefined);
			expect(output).toBe(1);
			expect(spies.found).toHaveBeenCalledWith(1);
		});

		test("(array).mapFirst --> the first boolean-valued map result (true at index 3)", () => {
			const output = SpiedOn.from(mapFirstValues).mapFirst(o => typeof o === "boolean" ? o : undefined);
			expect(output).toBe(true);
			expect(spies.found).toHaveBeenCalledWith(3);
		});

		test("(array).mapFirst --> last-value predicate returns the last item (true)", () => {
			const output = SpiedOn.from(mapFirstValues).mapFirst((o, i, iterableLike) => i === iterableLike.length - 1 ? o : undefined);
			expect(output).toBe(true);
		});

		test("(array).mapFirst --> a mapper returning `true` IS defined, so true wins instead of the 2", () => {
			const output = SpiedOn.from(mapFirstValues).mapFirst(o => o === 2);
			expect(output).toBe(true);
		});

		test("(array).mapFirst --> null is NOT defined: returning null at index 2 falls through to undefined/notFound", () => {
			const iterator = SpiedOn.from(mapFirstValues);
			const output = iterator.mapFirst(o => !o ? o : undefined);
			expect(output).toBeUndefined();
			expect(spies.notFound).toHaveBeenCalledTimes(1);
		});

		test("(set).mapFirst iterates set insertion order", () => {
			const output = SpiedOn.from(new Set(["a","b","c"])).mapFirst((v, i) => v === "b" ? i : undefined);
			expect(output).toBe(1);
			expect(spies.found).toHaveBeenCalledWith(1);
		});

		test("(array).mapFirst passes thisArg to the callback", () => {
			const ctx = { t: "!" };
			const output = Arrayish.from([1]).mapFirst(function(this: { t:string }, v) { return `${v}${this.t}`; }, ctx);
			expect(output).toBe("1!");
		});

	});

	describe(".partition", () => {

		test("(array).partition groups values by the returned partition index", () => {
			const inputValues = [2,1,null,"2",true,null,undefined,2,null,"1",1,false,true];
			const inputFunction = (val: unknown) => ["boolean","number","string","object","undefined","null"].indexOf(typeof(val));
			const expected = [
				[ true, false, true ],
				[ 2, 1, 2, 1 ],
				[ '2', '1' ],
				[ null, null, null ],
				[ undefined ]
			];
			const iterator = SpiedOn.from(inputValues);
			const partitioned = iterator.partition(inputFunction);
			expect(partitioned).toStrictEqual(expected);
		});

		test("QUIRK: (array).partition with negative/fractional indexes stores NON-INDEX properties — length stays 1 and JSON.stringify only shows index 0", () => {
			const partitioned = Arrayish.from([1,2,3]).partition(v => v === 1 ? -1 : v === 2 ? 0.5 : 0);

			expect(partitioned.length).toBe(1);
			// stored under the literal keys, invisible to length/iteration/JSON
			expect((partitioned as any)[-1]).toStrictEqual([1]);
			expect((partitioned as any)[0.5]).toStrictEqual([2]);
			expect(partitioned[0]).toStrictEqual([3]);
		});

		test("(array).partition passes thisArg to the partitionfn", () => {
			const ctx = { hi: 1 };
			const output = Arrayish.from(["a","b"]).partition(function(this: { hi:number }, v) { return v === "a" ? 0 : this.hi; }, ctx);
			expect(output).toStrictEqual([["a"], ["b"]]);
		});

	});

	describe(".remove", () => {

		test("(array).remove splices in place, returns removed values in original order, and fires filtered(index) per REMOVED item only", () => {
			const input = [1, 2, 3];
			const iterator = SpiedOn.from(input);
			const removed = iterator.remove(v => v % 2 === 0);

			expect(removed).toStrictEqual([2]);
			// the ORIGINAL array is mutated in place
			expect(input).toStrictEqual([1, 3]);
			expect(spies.start).toHaveBeenCalledTimes(1);
			expect(spies.filtered).toHaveBeenCalledTimes(1);
			expect(spies.filtered).toHaveBeenCalledWith(1);
			// increment fires for EVERY item (removed or not), with no count argument
			expect(spies.increment).toHaveBeenCalledTimes(3);
			expect(spies.finish).toHaveBeenCalledTimes(1);
		});

		test("(array).remove returns null and undefined matches unfiltered", () => {
			const input = [null, "x", undefined];
			const removed = Arrayish.from(input).remove(() => true);
			expect(removed.length).toBe(3);
			expect(Object.is(removed[0], null)).toBe(true);
			expect(removed[1]).toBe("x");
			expect(Object.is(removed[2], undefined)).toBe(true);
			expect(input).toStrictEqual([]);
		});

		test("(array).remove passes thisArg to the predicate", () => {
			const ctx = { drop: 2 };
			const input = [1, 2];
			const removed = Arrayish.from(input).remove(function(this: { drop:number }, v) { return v === this.drop; }, ctx);
			expect(removed).toStrictEqual([2]);
			expect(input).toStrictEqual([1]);
		});

		test("(array).remove with no matches returns [], leaves the input untouched, and never fires filtered", () => {
			const iterator = SpiedOn.from([1, 2]);
			expect(iterator.remove(() => false)).toStrictEqual([]);
			expect(spies.filtered).toHaveBeenCalledTimes(0);
			expect(spies.increment).toHaveBeenCalledTimes(2);
			expect(spies.finish).toHaveBeenCalledTimes(1);
		});

		test("(set).remove deletes matched values from the LIVE Set after iteration and returns them in insertion order", () => {
			const set = new Set(["a", "b", "c"]);
			const iterator = SpiedOn.from(set);
			const removed = iterator.remove(v => v !== "b");

			expect(removed).toStrictEqual(["a", "c"]);
			// the SAME Set instance is mutated (delete runs after the pass, so positions never shifted mid-iteration)
			expect([...set]).toStrictEqual(["b"]);
			expect(set.size).toBe(1);
			expect(spies.start).toHaveBeenCalledTimes(1);
			expect(spies.filtered).toHaveBeenCalledTimes(2);
			expect(spies.increment).toHaveBeenCalledTimes(3);
			expect(spies.finish).toHaveBeenCalledTimes(1);

			// NaN matches via SameValueZero
			const nanSet = new Set([NaN, 1]);
			expect(Arrayish.from(nanSet).remove(v => v !== v)).toStrictEqual([NaN]);
			expect(nanSet.size).toBe(1);
		});

		test("(arraylike object).remove iterates via Array.from and splices in place like an array", () => {
			const input = { 0:"a", 1:"b", length:2 };
			const iterator = SpiedOn.from(input);
			const removed = iterator.remove(v => v === "a");

			expect(removed).toStrictEqual(["a"]);
			// Array.prototype.splice.call mutates the plain object in place and shrinks length
			expect(input).toStrictEqual({ 0:"b", length:1 });
			expect(spies.start).toHaveBeenCalledTimes(1);
			expect(spies.filtered).toHaveBeenCalledTimes(1);
			expect(spies.increment).toHaveBeenCalledTimes(2);
			expect(spies.finish).toHaveBeenCalledTimes(1);
		});

		test("(arraylike object).remove reads holes as undefined and splices them like an array", () => {
			const input = { 0:"a", length:3 };
			const removed = Arrayish.from(input).remove(v => v === undefined);

			// both indexed holes match; the right-to-left splices shrink length to 1
			expect(removed.length).toBe(2);
			expect(Object.is(removed[0], undefined)).toBe(true);
			expect(Object.is(removed[1], undefined)).toBe(true);
			expect(input).toStrictEqual({ 0:"a", length:1 });
		});

		test("(array).remove(isDefined) removes every defined value, leaving only null and undefined entries", () => {
			const input = [2,1,null,"2",true,null,undefined,2,null,"1",1,false,true];
			const removed = Arrayish.from(input).remove(isDefined);

			expect(removed).toStrictEqual([2,1,"2",true,2,"1",1,false,true]);
			expect(input).toStrictEqual([null, null, undefined, null]);
		});

		test("(array).remove with no matches returns [] and leaves the named input array untouched", () => {
			const input = [1, null, 2];
			expect(Arrayish.from(input).remove(() => false)).toStrictEqual([]);
			expect(input).toStrictEqual([1, null, 2]);
		});

		test("(array).remove on a >10-element array splices correctly across the digit boundary (right-to-left splices keep indexes valid)", () => {
			const input = Array.from({ length: 12 }, (_, i) => i);
			const removed = Arrayish.from(input).remove(value => value % 2 === 0);

			expect(removed).toStrictEqual([0, 2, 4, 6, 8, 10]);
			expect(input).toStrictEqual([1, 3, 5, 7, 9, 11]);
		});

	});

	describe(".removeAt", () => {

		test("(array).removeAt(index) splices in place and returns the removed value", () => {
			const input = [1, 2, 3];
			expect(Arrayish.from(input).removeAt(1)).toBe(2);
			expect(input).toStrictEqual([1, 3]);
		});

		test("(array).removeAt with a single negative index counts from the END like .splice()", () => {
			const input = [1, 2, 3];
			expect(Arrayish.from(input).removeAt(-1)).toBe(3);
			expect(input).toStrictEqual([1, 2]);
		});

		test("(array).removeAt with a single out-of-range index is a no-op returning undefined", () => {
			const input = [1, 2];
			expect(Arrayish.from(input).removeAt(5)).toBeUndefined();
			expect(input).toStrictEqual([1, 2]);
		});

		test("(array).removeAt(indexes) returns values in GIVEN order while splicing descending", () => {
			const input = ["a", "b", "c"];
			expect(Arrayish.from(input).removeAt([2, 0])).toStrictEqual(["c", "a"]);
			expect(input).toStrictEqual(["b"]);
		});

		test("(array).removeAt reports one entry per index GIVEN — a duplicate reports its value twice but splices only once", () => {
			const input = [1, 2, 3, 4];
			expect(Arrayish.from(input).removeAt([1, 1])).toStrictEqual([2, 2]);
			// the value at index 1 is removed (and reported) once per given index, but spliced only once
			expect(input).toStrictEqual([1, 3, 4]);
		});

		test("(array).removeAt normalizes negatives positionally — -1 and length-1 splice together but each reports its own value", () => {
			const input = ["a", "b", "c"];
			expect(Arrayish.from(input).removeAt([-1, 2])).toStrictEqual(["c", "c"]);
			// both given indexes normalize to 2, so the last item is spliced once but reported twice
			expect(input).toStrictEqual(["a", "b"]);
		});

		test("(array).removeAt reports undefined for invalid indexes — one entry per index GIVEN, removals only for valid ones", () => {
			const input = ["a", "b", "c", "d"];
			// -1 normalizes to 3 (valid); 1.5 and 9 remove nothing but still occupy an output slot
			expect(Arrayish.from(input).removeAt([-1, 1.5, 9])).toStrictEqual(["d", undefined, undefined]);
			expect(input).toStrictEqual(["a", "b", "c"]);
		});

		test("(array).removeAt across the 10-index boundary splices NUMERICALLY — [2,10] removes values at indexes 2 and 10, not 2 and 11", () => {
			// a default lexicographic .sort() would rank "10" before "2" and remove the WRONG element
			const input = Array.from({ length:12 }, (_, i) => i);
			expect(Arrayish.from(input).removeAt([2, 10])).toStrictEqual([2, 10]);
			expect(input).toStrictEqual([0, 1, 3, 4, 5, 6, 7, 8, 9, 11]);
		});

		test("(set).removeAt(indexes) mutates the SAME Set by insertion position and returns values in GIVEN order", () => {
			const set = new Set(["a", "b", "c", "d"]);
			expect(Arrayish.from(set).removeAt([3, 1])).toStrictEqual(["d", "b"]);
			expect([...set]).toStrictEqual(["a", "c"]);

			// single negative counts from the end of insertion order
			expect(Arrayish.from(set).removeAt(-1)).toBe("c");
			expect([...set]).toStrictEqual(["a"]);
		});

		test("(arraylike object).removeAt(indexes) mutates the object and shrinks length like an array", () => {
			const input = { 0:"a", 1:"b", 2:"c", length:3 };
			expect(Arrayish.from(input).removeAt([0, 2])).toStrictEqual(["a", "c"]);
			expect(input).toStrictEqual({ 0:"b", length:1 });
		});

		test("removeAt fires NO events — index-driven like slice/splice, unlike the predicate-driven remove", () => {
			const iterator = SpiedOn.from([1, 2, 3]);
			iterator.removeAt(0);
			iterator.removeAt([0, 1]);

			expect(spies.start).toHaveBeenCalledTimes(0);
			expect(spies.increment).toHaveBeenCalledTimes(0);
			expect(spies.filtered).toHaveBeenCalledTimes(0);
			expect(spies.finish).toHaveBeenCalledTimes(0);
		});

	});

	describe(".slice", () => {

		test("(array).slice delegates to Array.prototype.slice", () => {
			expect(Arrayish.from([1, 2, 3, 4]).slice(1, 3)).toStrictEqual([2, 3]);
		});

		test("(array).slice() with no args copies the whole array", () => {
			const input = [1, 2];
			const output = Arrayish.from(input).slice();
			expect(output).toStrictEqual([1, 2]);
			expect(output).not.toBe(input);
		});

		test("(set).slice converts to an array first and supports negative indexes", () => {
			const iterator = Arrayish.from(new Set([1, 2, 3, 4]));
			expect(iterator.slice(-2)).toStrictEqual([3, 4]);
			expect(iterator.slice()).toStrictEqual([1, 2, 3, 4]);
		});

		test("(arraylike object).slice uses Array.prototype.slice.call", () => {
			const iterator = Arrayish.from({ 0:"a", 1:"b", length:2 });
			expect(iterator.slice(1)).toStrictEqual(["b"]);
		});

	});

	describe(".splice", () => {

		test("(array).splice delegates to native splice — mutates in place and returns the removed values", () => {
			const input = [1, 2, 3, 4];
			expect(Arrayish.from(input).splice(1, 2)).toStrictEqual([2, 3]);
			expect(input).toStrictEqual([1, 4]);
		});

		test("(array).splice with a negative start counts from the end", () => {
			const input = [1, 2, 3, 4, 5];
			expect(Arrayish.from(input).splice(-2, 1)).toStrictEqual([4]);
			expect(input).toStrictEqual([1, 2, 3, 5]);
		});

		test("(array).splice with deleteCount past the end removes through the last item", () => {
			const input = [1, 2, 3];
			expect(Arrayish.from(input).splice(1, 99)).toStrictEqual([2, 3]);
			expect(input).toStrictEqual([1]);
		});

		test("(array).splice with deleteCount=0 removes nothing and leaves the array untouched", () => {
			const input = [1, 2];
			expect(Arrayish.from(input).splice(1, 0)).toStrictEqual([]);
			expect(input).toStrictEqual([1, 2]);
		});

		test("(array).splice with an out-of-range start returns [] and leaves the array untouched", () => {
			const input = [1, 2];
			expect(Arrayish.from(input).splice(5, 1)).toStrictEqual([]);
			expect(input).toStrictEqual([1, 2]);
		});

		test("(set).splice removes by insertion position and mutates the SAME Set instance", () => {
			const set = new Set([1, 2, 3, 4]);
			const iterator = Arrayish.from(set);

			// behaves as if converted to an array, spliced, and the remaining values converted back — except the original Set is mutated
			expect(iterator.splice(1, 2)).toStrictEqual([2, 3]);
			expect([...set]).toStrictEqual([1, 4]);
			expect(set.size).toBe(2);

			// further operations see the SAME (mutated) instance
			expect(iterator.length).toBe(2);
			expect([...iterator.toSet()]).toStrictEqual([1, 4]);
		});

		test("(set).splice with a negative start counts from the end of insertion order", () => {
			const set = new Set(["a", "b", "c"]);
			expect(Arrayish.from(set).splice(-1, 1)).toStrictEqual(["c"]);
			expect([...set]).toStrictEqual(["a", "b"]);
		});

		test("(set).splice deletes NaN via SameValueZero", () => {
			const set = new Set([NaN, 1]);
			const removed = Arrayish.from(set).splice(0, 1);
			expect(removed.length).toBe(1);
			expect(Object.is(removed[0], NaN)).toBe(true);
			expect([...set]).toStrictEqual([1]);
		});

		test("(arraylike object).splice uses Array.prototype.splice.call — mutates the object and shrinks length like an array", () => {
			const input = { 0:"a", 1:"b", length:2 };
			expect(Arrayish.from(input).splice(0, 1)).toStrictEqual(["a"]);
			// the plain object is mutated in place — index 0 now holds "b" and length shrank to 1
			expect(input).toStrictEqual({ 0:"b", length:1 });
		});

		test("(set).splice with deleteCount=0 leaves the Set untouched", () => {
			const set = new Set([1, 2]);
			expect(Arrayish.from(set).splice(1, 0)).toStrictEqual([]);
			expect([...set]).toStrictEqual([1, 2]);
		});

	});

});

describe("Async", () => {

	test("(array).async().filter awaits predicates and fires filtered(index)", async () => {
		const iterator = SpiedOn.from([1, 2, 3]);
		const output = await iterator.async().filter(async v => v !== 2);

		expect(output).toStrictEqual([1, 3]);
		expect(spies.start).toHaveBeenCalledTimes(1);
		expect(spies.filtered).toHaveBeenCalledTimes(2);
		expect(spies.filtered).toHaveBeenNthCalledWith(1, 0);
		expect(spies.filtered).toHaveBeenNthCalledWith(2, 2);
		expect(spies.increment).toHaveBeenCalledTimes(3);
		expect(spies.finish).toHaveBeenCalledTimes(1);
	});

	test("(array).async().filter accepts plain synchronous predicates (Awaitable)", async () => {
		const output = await Arrayish.async([1, 2, 3]).filter(v => v > 1);
		expect(output).toStrictEqual([2, 3]);
	});

	test("(array).async().find awaits predicates and fires found(index)", async () => {
		const iterator = SpiedOn.from([1, 2, 3]);
		const output = await iterator.async().find(async v => v === 3);

		expect(output).toBe(3);
		expect(spies.found).toHaveBeenCalledWith(2);
		expect(spies.increment).toHaveBeenCalledTimes(2);
	});

	test("(array).async().find with no match fires notFound", async () => {
		const iterator = SpiedOn.from([1, 2, 3]);
		const output = await iterator.async().find(v => v === 9);

		expect(output).toBeUndefined();
		expect(spies.notFound).toHaveBeenCalledTimes(1);
	});

	test("(array).async().find ignores concurrency: the LOWEST matching index wins even when a later predicate resolves first", async () => {
		// index 0 takes 20ms, index 1 resolves immediately — find still returns 1 (index order is preserved)
		const output = await Arrayish.async([1, 2]).find(async v => {
			if (v === 1) await sleep(20);
			return true;
		});
		expect(output).toBe(1);
	});

	test("(array).async().forBatch fires increment(batchLength)", async () => {
		const iterator = SpiedOn.from([1, 2, 3]);
		await iterator.async().forBatch(2, () => {});

		expect(spies.start).toHaveBeenCalledTimes(1);
		expect(spies.increment).toHaveBeenNthCalledWith(1, 2);
		expect(spies.increment).toHaveBeenNthCalledWith(2, 1);
		expect(spies.finish).toHaveBeenCalledTimes(1);
	});

	test("(set).async().forBatch with batchSize > length yields a single batch", async () => {
		const batches: number[][] = [];
		await Arrayish.async(new Set([1, 2, 3])).forBatch(5, batch => { batches.push(batch); });
		expect(batches).toStrictEqual([[1, 2, 3]]);
	});

	describe(".forEach", () => {

		test("(array).forEach", async () => {
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

		test("(set).forEach", async () => {
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

		test("(array).map", async () => {
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

		test("(set).map", async () => {
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

		test("(array).async().map passes thisArg to the callback", async () => {
			const ctx = { t: "!" };
			const output = await Arrayish.async([1, 2]).map(async function(this: { t:string }, v, i) { return `${v}${i}${this.t}`; }, ctx);
			expect(output).toStrictEqual(["10!", "21!"]);
		});

	});

});

describe("Parallel", () => {

	describe(".forEach", () => {

		test("(array).forEach", async () => {
			const dataArray = new Array(100).fill(1);
			const iterator = SpiedOn.from(dataArray);

			const mappedValues: number[] = [];
			await iterator.parallel().forEach((v, i) => { mappedValues.push(v * i); });

			expect(spies.start).toHaveBeenCalledTimes(1);
			expect(spies.increment).toHaveBeenCalledTimes(dataArray.length);
			expect(spies.finish).toHaveBeenCalledTimes(1);
			dataArray.forEach((v, i) => {
				expect(v * i).toBe(mappedValues[i]);
			});
		});

		test("(set).forEach --> fail", async () => {
			const dataArray = [1, 1, "a", "a", "b", "b", 2, 2, "c", "c", "1", "2", "3", "4", "5"];
			const dataSet = new Set(dataArray);
			const iterator = SpiedOn.from(dataSet);

			const mapped: number[] = [];
			await iterator.parallel().forEach(async (v, i) => {
				// random sleep intervals
				await sleep(randomInt(1, 5) * 100);
				// ensures the map is out of order
				mapped.push(+v * i);
			});

			expect(spies.start).toHaveBeenCalledTimes(1);
			expect(spies.increment).toHaveBeenCalledTimes(dataSet.size);
			expect(spies.finish).toHaveBeenCalledTimes(1);

			const expected = Array.from(dataSet).map((v, i) => +v * i);
			// we expect the mapped array to be out of order and thus NOT equal
			expect(mapped).not.toEqual(expected);
		});

		test("(set).forEach --> pass", async () => {
			const dataArray = [1, 1, "a", "a", "b", "b", 2, 2, "c", "c", "1", "2", "3", "4", "5"];
			const dataSet = new Set(dataArray);
			const iterator = SpiedOn.from(dataSet);

			const mapped: number[] = [];
			await iterator.parallel().forEach(async (v, i) => {
				// random sleep interval
				await sleep(randomInt(1, 5) * 100);
				// indexed set ensures the map is in order
				mapped[i] = +v * i;
			});

			expect(spies.start).toHaveBeenCalledTimes(1);
			expect(spies.increment).toHaveBeenCalledTimes(dataSet.size);
			expect(spies.finish).toHaveBeenCalledTimes(1);

			const expected = Array.from(dataSet).map((v, i) => +v * i);
			// we expect the mapped array to be in order and thus equal
			expect(mapped).toEqual(expected);
		});

		test("(arraylike object).forEach indexes it directly (no Set conversion needed)", async () => {
			const seen: [unknown, number][] = [];
			await Arrayish.from({ 0:"a", 1:"b", length:2 }).parallel({ concurrency: 2 }).forEach((v, i) => { seen.push([v, i]); });
			expect(seen).toStrictEqual([["a", 0], ["b", 1]]);
		});

		test("(empty array).forEach fires only start/finish (Math.min(concurrency, 0) workers)", async () => {
			const iterator = SpiedOn.from([]);
			await iterator.parallel().forEach(() => {});
			expect(spies.start).toHaveBeenCalledTimes(1);
			expect(spies.increment).toHaveBeenCalledTimes(0);
			expect(spies.finish).toHaveBeenCalledTimes(1);
		});

		test("(array).forEach with concurrency > length clamps workers to length", async () => {
			const seen: number[] = [];
			await Arrayish.from([1, 2]).parallel({ concurrency: 99 }).forEach(v => { seen.push(v); });
			expect(seen).toStrictEqual([1, 2]);
		});

	});

	describe(".map", () => {

		test("(array).map default concurrency is 1 (NOT Infinity like forEach)", async () => {
			const output = await Arrayish.from([1, 2, 3]).parallel().map(async v => {
				if (v === 1) await sleep(15);
				return v;
			});
			expect(output).toStrictEqual([1, 2, 3]);
		});

		test("(array).map with concurrency > 1 returns results in INDEX order even when completion order differs", async () => {
			// four workers grab indexes 0..3 up front; worker 0 sleeps 20ms, so workers 1–3 finish first
			const output = await Arrayish.from([1, 2, 3, 4]).parallel({ concurrency: 4 }).map(async v => {
				if (v === 1) await sleep(20);
				return v * 10;
			});

			// indexed writes land each result at its own index regardless of which promise resolves first
			expect(output).toStrictEqual([10, 20, 30, 40]);
		});

		test("(array).parallel().map fires attached events", async () => {
			const iterator = SpiedOn.from([1, 2]);
			await iterator.parallel({ concurrency: 2 }).map(async v => v);
			expect(spies.start).toHaveBeenCalledTimes(1);
			expect(spies.increment).toHaveBeenCalledTimes(2);
			expect(spies.finish).toHaveBeenCalledTimes(1);
		});

	});

});

