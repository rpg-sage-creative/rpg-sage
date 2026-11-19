import { describe, expect, test } from "vitest";
import { wrapSetIterator } from "../../build/index.js";

describe("wrapSetIterator", () => {

	const values = ["a","b","c"];
	const valueFn = (value:string) => ({ value, skip:false });

	test(`for...of yields every value in order`, () => {
		let index = 0;
		for (const value of wrapSetIterator(values, valueFn)) {
			expect(value).toBe(values[index++]);
		}
		expect(index).toBe(3);
	});

	test(`manual next() loop terminates on done`, () => {
		let index = 0;
		const iterator = wrapSetIterator(values, valueFn);
		let val: IteratorResult<string>;
		do {
			val = iterator.next();
			expect(val.value).toBe(values[index++]);
		} while (!val.done);
		expect(index).toBe(4); // 3 values + the done result
	});

	test(`skip:true filters elements out`, () => {
		const kept = wrapSetIterator(["a","b","c"], (v:string) => ({ value:v, skip:v === "b" }));
		expect([...kept]).toEqual(["a","c"]);
	});

	test(`values can be transformed by the value function`, () => {
		const upper = wrapSetIterator(values, (v:string) => ({ value:v.toUpperCase(), skip:false }));
		expect([...upper]).toEqual(["A","B","C"]);
	});

	// QUIRK: Array.from() drains a generator source eagerly at wrap time.
	test(`generator source is drained eagerly when wrapped`, () => {
		function* gen() { yield 1; yield 2; }
		const source = gen();
		// TYPING GAP: Generator is not assignable to the declared SetIterator parameter, though Array.from consumes it fine.
		const iterator = wrapSetIterator(source as unknown as SetIterator<number>, (v:number) => ({ value:v, skip:false }));
		expect([...source]).toEqual([]); // already consumed by the wrapper
		expect([...iterator]).toEqual([1,2]);
	});

	test(`empty input yields nothing`, () => {
		const iterator = wrapSetIterator([] as string[], valueFn);
		expect(iterator.next().done).toBe(true);
	});

	test(`iterator is one-shot — a second pass yields []`, () => {
		const iterator = wrapSetIterator(["a"], valueFn);
		expect([...iterator]).toEqual(["a"]);
		expect([...iterator]).toEqual([]);
	});

});
