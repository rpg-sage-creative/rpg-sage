import { describe, expect, test } from "vitest";
import { Cache, HasCache } from "../build/index.js";

class Cacher extends HasCache {
	public constructor(msToLiveOrCache?: number | Cache) { super(msToLiveOrCache as never); }
	public read(key:string) {
		return this.cache.getOrSet(key, () => `value-for-${key}`);
	}
}

describe("HasCache", () => {

	test(`the built-in cache stores and returns values`, () => {
		const cacher = new Cacher();
		expect(cacher.read(`a`)).toBe(`value-for-a`);
	});

	test(`values are cached across calls on the same instance`, () => {
		const cacher = new Cacher();
		cacher.cache.getOrSet(`a`, () => `first`);
		expect(cacher.read(`a`)).toBe(`first`);
	});

	test(`instances do not share their default caches`, () => {
		const one = new Cacher();
		const two = new Cacher();
		one.cache.getOrSet(`a`, () => `mine`);
		expect(two.read(`a`)).toBe(`value-for-a`);
	});

	test(`an injected Cache is shared between instances`, () => {
		const shared = new Cache();
		const one = new Cacher(shared);
		const two = new Cacher(shared);
		one.cache.getOrSet(`a`, () => `shared-value`);
		expect(two.read(`a`)).toBe(`shared-value`);
	});

	test(`an injected msToLive produces an expiring cache`, async () => {
		const cacher = new Cacher(20);
		cacher.cache.getOrSet(`k`, () => `v`);
		expect(cacher.read(`k`)).toBe(`v`);
		await new Promise(res => setTimeout(res, 60));
		expect(cacher.read(`k`)).toBe(`value-for-k`);
	});

	test(`destroy() drops the cached values`, () => {
		const cacher = new Cacher();
		cacher.cache.getOrSet(`a`, () => `first`);
		cacher.destroy();
		expect(cacher.read(`a`)).toBe(`value-for-a`);
	});

	test(`destroy() on a fresh instance is safe`, () => {
		expect(() => new Cacher().destroy()).not.toThrow();
	});

});
