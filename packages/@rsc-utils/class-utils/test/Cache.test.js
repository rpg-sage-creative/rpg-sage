import { Cache } from "../build/index.js";

describe("Cache", () => {

	const cache = new Cache();

	let called = 0;
	const create = alpha => { called++; return { alpha }; };

	test(`cache.clear() does nothing`, () => {
		expect(cache.clear()).toBe(false);
	});
	test(`cache.get("a") returns undefined when doesn't exist`, () => {
		expect(cache.get("a")).toBeUndefined();
	});
	test(`cache.getOrSet("a", () => create("a")) returns {alpha:"a"} and create was called`, () => {
		expect(cache.getOrSet("a", () => create("a"))).toStrictEqual({alpha:"a"});
		expect(called).toBe(1);
	});
	test(`cache.get("a") returns {alpha:"a"} now that getOrSet was used; create was not called`, () => {
		expect(cache.get("a")).toStrictEqual({alpha:"a"});
		expect(called).toBe(1);
	});
	test(`cache.delete("a") removes data`, () => {
		expect(cache.delete("a")).toBe(true);
	});
	test(`cache.get("a") returns undefined when doesn't exist`, () => {
		expect(cache.get("a")).toBeUndefined();
	});
	test(`cache.getOrFetch("b", async () => create("b")) returns {alpha:"b"} and create was called`, async () => {
		expect(await cache.getOrFetch("b", async () => create("b"))).toStrictEqual({alpha:"b"});
		expect(called).toBe(2);
	});
	test(`cache.clear() removes data`, () => {
		expect(cache.clear()).toBe(true);
	});
	test(`cache.get("b") returns undefined when doesn't exist`, () => {
		expect(cache.get("b")).toBeUndefined();
	});

});
