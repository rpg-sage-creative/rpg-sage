import { describe, expect, test } from "vitest";
import { wrapIterableIterator } from "../../build/index.js";

describe("wrapIterableIterator", () => {

	const valueFn = (value:string) => ({ value, skip:false });

	test(`for...of yields every value in order`, () => {
		let index = 0;
		for (const value of wrapIterableIterator(["a","b","c"], valueFn)) {
			expect(value).toBe(["a","b","c"][index++]);
		}
		expect(index).toBe(3);
	});

	test(`skip:true filters elements out`, () => {
		const kept = wrapIterableIterator([1,2,3], (v:number) => ({ value:v * 10, skip:v === 2 }));
		expect([...kept]).toEqual([10,30]);
	});

	test(`values can be transformed by the value function`, () => {
		const upper = wrapIterableIterator(["a","b"], (v:string) => ({ value:v.toUpperCase(), skip:false }));
		expect([...upper]).toEqual(["A","B"]);
	});

	// TYPING GAP: the signature only accepts ArrayLike|IterableIterator, but Array.from drains ANY iterable at runtime.
	test(`accepts a Set as iterable source`, () => {
		const kept = wrapIterableIterator(new Set(["a","b"]) as unknown as IterableIterator<string>, valueFn);
		expect([...kept]).toEqual(["a","b"]);
	});

	test(`empty input yields nothing and reports done immediately`, () => {
		const iterator = wrapIterableIterator([] as string[], valueFn);
		expect(iterator.next()).toEqual({ done:true, value:undefined });
	});

	// QUIRK: unlike the Map/Set wrappers (Iterator.from), this one returns a plain object whose
	// [Symbol.iterator]() hands back THE SAME instance — and it is single-use either way.
	test(`[Symbol.iterator]() returns the same wrapper instance`, () => {
		const iterator = wrapIterableIterator(["a"], valueFn);
		expect(iterator[Symbol.iterator]()).toBe(iterator);
	});

	test(`iterator is one-shot — a second pass yields []`, () => {
		const iterator = wrapIterableIterator(["a","b"], valueFn);
		expect([...iterator]).toEqual(["a","b"]);
		expect([...iterator]).toEqual([]);
	});

	test(`next() after exhaustion keeps reporting done with undefined value`, () => {
		const iterator = wrapIterableIterator(["a"], valueFn);
		iterator.next();
		expect(iterator.next()).toEqual({ done:true, value:undefined });
		expect(iterator.next().done).toBe(true);
	});

	test(`generator source is drained eagerly when wrapped`, () => {
		function* gen() { yield 1; yield 2; }
		const source = gen();
		// TYPING GAP: Generator is not assignable to the declared IterableIterator parameter, though Array.from consumes it fine.
		const iterator = wrapIterableIterator(source as unknown as IterableIterator<number>, (v:number) => ({ value:v, skip:false }));
		expect([...source]).toEqual([]); // already consumed by Array.from in the wrapper
		expect([...iterator]).toEqual([1,2]);
	});

});
