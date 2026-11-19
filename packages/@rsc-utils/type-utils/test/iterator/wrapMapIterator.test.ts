import { describe, expect, test } from "vitest";
import { wrapMapIterator } from "../../build/index.js";

describe("wrapMapIterator", () => {

	const map = { a:"A", b:"B", c:"C", d:undefined };
	type MapKey = keyof typeof map;
	const keys = Object.keys(map) as MapKey[];
	const values = Object.values(map);

	type ValueResult = { skip:boolean; value:string };

	// skips anything that is not a key of the map (accepts arbitrary strings)
	const keyFn = (key:string): ValueResult => ({ value:key, skip:!(key in map) });
	// skips keys whose mapped value is falsy (so "d":undefined is skipped)
	const valueFn = (key:MapKey): ValueResult => ({ value:key, skip:!map[key] });

	test(`iterating keys yields every key via for...of`, () => {
		let index = 0;
		for (const key of wrapMapIterator(keys, keyFn)) {
			expect(key).toBe(keys[index]);
			index++;
		}
		expect(index).toBe(4);
	});

	test(`keys with falsy values are skipped — "d":undefined is dropped`, () => {
		const yielded = [...wrapMapIterator(keys, valueFn)];
		expect(yielded).toEqual(["a","b","c"]);
	});

	test(`yielded keys round-trip to the map's values`, () => {
		let index = 0;
		for (const key of wrapMapIterator(keys, keyFn)) {
			expect(map[key as MapKey]).toBe(values[index++]);
		}
		expect(index).toBe(4);
	});

	test(`keyFn skips strings that are not keys of the map`, () => {
		const yielded = [...wrapMapIterator(["a","zz"], keyFn)];
		expect(yielded).toEqual(["a"]);
	});

	test(`skip:true filters elements out entirely`, () => {
		const iterator = wrapMapIterator(["a","b","c"], (k:string) => ({ value:k.toUpperCase(), skip:k === "b" }));
		expect([...iterator]).toEqual(["A","C"]);
	});

	test(`accepts a real Map#values() iterator as source`, () => {
		const source = new Map([["k1", 1], ["k2", 2]]);
		const doubled = wrapMapIterator(source.values(), (v:number) => ({ value:v * 10, skip:false }));
		expect([...doubled]).toEqual([10, 20]);
	});

	test(`accepts a real Set#values() iterator as source`, () => {
		const source = new Set(["x", "y"]);
		const kept = wrapMapIterator(source.values(), (v:string) => ({ value:v, skip:v === "x" }));
		expect([...kept]).toEqual(["y"]);
	});

	test(`empty input yields nothing`, () => {
		const iterator = wrapMapIterator([] as string[], (v:string) => ({ value:v, skip:false }));
		expect(iterator.next().done).toBe(true);
	});

	// QUIRK: the source is eagerly Array.from'd and consumed by shift(), so a second pass yields nothing.
	test(`iterator is one-shot — spreading twice yields [] the second time`, () => {
		const iterator = wrapMapIterator(["a"], (v:string) => ({ value:v, skip:false }));
		expect([...iterator]).toEqual(["a"]);
		expect([...iterator]).toEqual([]);
	});

	test(`next() after exhaustion keeps reporting done`, () => {
		const iterator = wrapMapIterator(["a"], (v:string) => ({ value:v, skip:false }));
		iterator.next();
		expect(iterator.next()).toEqual({ done:true, value:undefined });
	});

});
