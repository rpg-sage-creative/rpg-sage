import { describe, expect, test } from "vitest";
import { Cache } from "../build/index.js";

const sleep = (ms:number) => new Promise(res => setTimeout(res, ms));

describe("Cache", () => {

	describe("get / getOrSet", () => {

		test(`get() returns undefined for a missing key`, () => {
			expect(new Cache().get(`a`)).toBeUndefined();
		});

		test(`getOrSet() calls the factory and caches the value`, () => {
			const cache = new Cache();
			let called = 0;
			expect(cache.getOrSet(`a`, () => { called++; return { alpha:`a` }; })).toStrictEqual({ alpha:`a` });
			expect(called).toBe(1);
		});

		test(`get() returns the cached value without calling the factory again`, () => {
			const cache = new Cache();
			let called = 0;
			cache.getOrSet(`a`, () => { called++; return `v`; });
			expect(cache.get(`a`)).toBe(`v`);
			expect(called).toBe(1);
		});

		test(`getOrSet() returns the cached value for a repeated key`, () => {
			const cache = new Cache();
			cache.getOrSet(`a`, () => `first`);
			expect(cache.getOrSet(`a`, () => `second`)).toBe(`first`);
		});

		test(`falsy values are cached and not refetched`, () => {
			const cache = new Cache();
			cache.getOrSet(`zero`, () => 0);
			let calledAgain = false;
			expect(cache.getOrSet(`zero`, () => { calledAgain = true; return 1; })).toBe(0);
			expect(calledAgain).toBe(false);
		});

	});

	describe("getOrFetch", () => {

		test(`awaits the factory and caches the resolved value`, async () => {
			const cache = new Cache();
			let called = 0;
			expect(await cache.getOrFetch(`b`, async () => { called++; return { alpha:`b` }; })).toStrictEqual({ alpha:`b` });
			expect(called).toBe(1);
		});

		test(`a second getOrFetch for the same key does not call the factory again`, async () => {
			const cache = new Cache();
			await cache.getOrFetch(`b`, async () => `first`);
			let calledAgain = false;
			expect(await cache.getOrFetch(`b`, async () => { calledAgain = true; return `second`; })).toBe(`first`);
			expect(calledAgain).toBe(false);
		});

	});

	describe("delete and clear", () => {

		test(`clear() on an empty cache returns false`, () => {
			expect(new Cache().clear()).toBe(false);
		});

		test(`delete() on a missing key returns false`, () => {
			expect(new Cache().delete(`a`)).toBe(false);
		});

		test(`delete() removes the value and reports true`, () => {
			const cache = new Cache();
			cache.getOrSet(`a`, () => 1);
			expect(cache.delete(`a`)).toBe(true);
			expect(cache.get(`a`)).toBeUndefined();
		});

		test(`clear() removes all values and reports true`, () => {
			const cache = new Cache();
			cache.getOrSet(`b`, () => 1);
			expect(cache.clear()).toBe(true);
			expect(cache.get(`b`)).toBeUndefined();
		});

		test(`clear() after delete (empty but created map) returns false`, () => {
			const cache = new Cache();
			cache.getOrSet(`a`, () => 1);
			cache.delete(`a`);
			expect(cache.clear()).toBe(false);
		});

	});

	describe("destroy", () => {

		test(`destroy() releases the cached values`, () => {
			const cache = new Cache();
			cache.getOrSet(`x`, () => 1);
			cache.destroy();
			expect(cache.get(`x`)).toBeUndefined();
		});

		test(`a destroyed cache can be used again`, () => {
			const cache = new Cache();
			let called = 0;
			cache.getOrSet(`y`, () => { called++; return 1; });
			cache.destroy();
			expect(cache.getOrSet(`y`, () => { called++; return 2; })).toBe(2);
			expect(called).toBe(2);
		});

		test(`a destroyed cache can fetch again`, async () => {
			const cache = new Cache();
			let called = false;
			cache.destroy();
			expect(await cache.getOrFetch(`y`, async () => { called = true; return 2; })).toBe(2);
			expect(called).toBe(true);
		});

		test(`delete() and clear() on a destroyed cache report false`, () => {
			const cache = new Cache();
			cache.getOrSet(`x`, () => 1);
			cache.destroy();
			expect(cache.delete(`x`)).toBe(false);
			expect(cache.clear()).toBe(false);
		});

		test(`destroy() can be called more than once`, () => {
			const cache = new Cache();
			cache.destroy();
			expect(() => cache.destroy()).not.toThrow();
		});

	});

	describe("msToLive (EphemeralMap)", () => {

		test(`values are available before the ttl expires`, () => {
			const cache = new Cache(1000);
			cache.getOrSet(`k`, () => `v`);
			expect(cache.get(`k`)).toBe(`v`);
		});

		test(`values expire after the ttl`, async () => {
			const cache = new Cache(20);
			cache.getOrSet(`k`, () => `v`);
			await sleep(60);
			expect(cache.get(`k`)).toBeUndefined();
		});

	});

});
