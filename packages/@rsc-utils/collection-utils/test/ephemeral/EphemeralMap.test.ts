import { afterEach, describe, expect, test, vi } from "vitest";
import { EphemeralMap } from "../../build/index.js";

describe("EphemeralMap", () => {

	describe("constructor validation (EphemeralBase)", () => {

		test(`msToLive at or below 1 throws RangeError via error-utils rangeError()`, () => {
			expect(() => new EphemeralMap(0)).toThrow(RangeError);
			// the message comes from @rsc-utils/error-utils rangeError({ argKey, mustBe, value }) and interpolates the received value
			expect(() => new EphemeralMap(0)).toThrow('The "msToLive" argument must be a finite number greater than 1. Received 0');
			expect(() => new EphemeralMap(-5)).toThrow('The "msToLive" argument must be a finite number greater than 1. Received -5');
		});

		test(`msToLive of exactly 1 THROWS — the guard rejects everything at or below 1, so the message is honest (changed 2026-11-23; it used to accept 1)`, () => {
			expect(() => new EphemeralMap(1)).toThrow('The "msToLive" argument must be a finite number greater than 1. Received 1');
		});

		test(`NaN throws via the Number.isFinite gate (the old guard needed a (msToLive || 0) coercion trick for this)`, () => {
			expect(() => new EphemeralMap(Number.NaN)).toThrow(RangeError);
			expect(() => new EphemeralMap(Number.NaN)).toThrow("Received NaN");
		});

		test(`Infinity THROWS — an ephemeral collection whose data never expires defeats the entire point of the class (guard tightened 2026-11-23; it used to be accepted)`, () => {
			expect(() => new EphemeralMap(Infinity)).toThrow(RangeError);
			expect(() => new EphemeralMap(-Infinity)).toThrow('The "msToLive" argument must be a finite number greater than 1. Received -Infinity');
		});

		test(`a valid ttl is stored on the readonly msToLive property`, () => {
			const map = new EphemeralMap(5_000);
			expect(map.msToLive).toBe(5_000);
		});

	});

	describe("lazy expiry on reads (EphemeralBase)", () => {

		// toFake:["Date"] shifts the clock only — real setTimeout keeps the cleanup timer from firing, so expired-but-not-yet-cleaned entries are observable deterministically
		const ttl = 60_000;

		afterEach(() => vi.useRealTimers());

		test(`has/get report an expired entry as missing and EVICT it lazily (size drops between cleanups)`, () => {
			vi.useFakeTimers({ toFake:["Date"] });
			const start = Date.now();
			const map = new EphemeralMap<string, number>(ttl);
			map.set("a", 1);

			expect(map.has("a")).toBe(true);
			expect(map.get("a")).toBe(1);

			// the entry is expired now; the real cleanup timer (~60s away) has NOT fired
			vi.setSystemTime(start + ttl + 1);

			expect(map.get("a")).toBeUndefined();
			expect(map.size).toBe(0); // get() evicted it

			map.clear(); // drop the pending real timer
		});

		test(`has also reports expired entries as missing and evicts them`, () => {
			vi.useFakeTimers({ toFake:["Date"] });
			const start = Date.now();
			const map = new EphemeralMap<string, number>(ttl);
			map.set("a", 1);

			vi.setSystemTime(start + ttl + 1);

			expect(map.has("a")).toBe(false);
			expect(map.size).toBe(0); // has() evicted it

			map.clear();
		});

		test(`entries/keys/values SKIP expired entries without evicting (size stays until cleanup or a has/get)`, () => {
			vi.useFakeTimers({ toFake:["Date"] });
			const start = Date.now();
			const map = new EphemeralMap<string, number>(ttl);
			map.set("a", 1).set("b", 2);

			vi.setSystemTime(start + ttl + 1);

			expect([...map.entries()]).toStrictEqual([]);
			expect([...map.keys()]).toStrictEqual([]);
			expect([...map.values()]).toStrictEqual([]);
			// iterators are read-only — eviction belongs to cleanup and has/get
			expect(map.size).toBe(2);

			map.clear();
		});

		test(`SNAPSHOT semantics: an iterator captured BEFORE expiry still yields the entry after the clock passes its ttl (expiry cutoff is frozen at creation)`, () => {
			vi.useFakeTimers({ toFake:["Date"] });
			const start = Date.now();
			const map = new EphemeralMap<string, number>(ttl);
			map.set("a", 1);

			// hold the iterator — its cutoff freezes at creation time
			const it = map.entries();

			vi.setSystemTime(start + ttl + 1);

			// consumed AFTER expiry: the frozen cutoff still considers 'a' live...
			expect([...it]).toStrictEqual([["a", 1]]);
			// ...but a FRESH iterator made after the clock jump sees the expiry
			expect([...map.entries()]).toStrictEqual([]);

			map.clear();
		});

		test(`MEMBERSHIP stays live despite the frozen cutoff: keys deleted after iterator creation are skipped`, () => {
			vi.useFakeTimers({ toFake:["Date"] });
			const map = new EphemeralMap<string, number>(ttl);
			map.set("a", 1).set("b", 2);

			// wrapMapIterator snapshots keys eagerly; the mapper re-checks existence per next()
			const it = map.entries();
			map.delete("a");

			expect([...it]).toStrictEqual([["b", 2]]);

			map.clear();
		});

		test(`expiry is PER-ENTRY: a re-set refreshes only that key's timestamp`, () => {
			vi.useFakeTimers({ toFake:["Date"] });
			const start = Date.now();
			const map = new EphemeralMap<string, number>(ttl);
			map.set("a", 1);

			// b is set at the halfway point and outlives a by half a ttl
			vi.setSystemTime(start + Math.round(ttl / 2));
			map.set("b", 2);

			vi.setSystemTime(start + ttl + 1); // a expired, b has ttl/2 left

			expect(map.has("a")).toBe(false);
			expect([...map.keys()]).toStrictEqual(["b"]);
			expect(map.get("b")).toBe(2);

			map.clear();
		});

	});

	describe("map surface", () => {

		test(`set/get/has/delete/size follow Map semantics; get returns the stored value`, () => {
			const map = new EphemeralMap<string, number>(60_000);
			expect(map.size).toBe(0);
			expect(map.get("z")).toBeUndefined();
			expect(map.has("z")).toBe(false);

			// set returns `this`, so it chains
			expect(map.set("a", 1)).toBe(map);
			map.set("b", 2);
			expect(map.size).toBe(2);
			expect(map.get("a")).toBe(1);
			expect(map.has("b")).toBe(true);

			expect(map.delete("a")).toBe(true);
			expect(map.delete("a")).toBe(false);
			expect(map.size).toBe(1);
		});

		test(`set on an existing key overwrites the value`, () => {
			const map = new EphemeralMap<string, number>(60_000);
			map.set("a", 1).set("a", 2);
			expect(map.get("a")).toBe(2);
			expect(map.size).toBe(1);
		});

		test(`clear empties the map`, () => {
			const map = new EphemeralMap<string, number>(60_000);
			map.set("a", 1);
			map.clear();
			expect(map.size).toBe(0);
			expect(map.has("a")).toBe(false);
		});

		test(`entries/keys/values/[Symbol.iterator] iterate insertion order`, () => {
			const map = new EphemeralMap<string, number>(60_000);
			map.set("a", 1).set("b", 2);
			expect([...map.entries()]).toStrictEqual([["a", 1], ["b", 2]]);
			expect([...map.keys()]).toStrictEqual(["a", "b"]);
			expect([...map.values()]).toStrictEqual([1, 2]);
			// spread uses [Symbol.iterator] -> entries
			expect([...map]).toStrictEqual([["a", 1], ["b", 2]]);
		});

		test(`forEach passes (value, key, map) and honors thisArg`, () => {
			const map = new EphemeralMap<string, number>(60_000);
			map.set("a", 1);
			const seen: [number, string, boolean][] = [];
			map.forEach(function(this: { t:string }, value, key, m) {
				seen.push([value, key, m === map]);
				expect(this.t).toBe("!");
			}, { t:"!" });
			expect(seen).toStrictEqual([[1, "a", true]]);
		});

		test(`keys/values/entries SKIP entries deleted during iteration`, () => {
			const map = new EphemeralMap<string, number>(60_000);
			map.set("a", 1).set("b", 2).set("c", 3);
			const seen: string[] = [];
			for (const [key] of map.entries()) {
				seen.push(key);
				if (key === "a") map.delete("b");
			}
			expect(seen).toStrictEqual(["a", "c"]);
		});

		test(`Symbol.toStringTag renders as "[object EphemeralMap]"`, () => {
			const map = new EphemeralMap<string, number>(60_000);
			expect(Object.prototype.toString.call(map)).toBe("[object EphemeralMap]");
		});

		test(`toJSON keeps JSON.stringify from throwing on the internal timer — plain stringify still DROPS entries (the Map serializes as {}); use json-utils encodeJson/decodeJson/cloneJson for a lossless round-trip`, () => {
			const map = new EphemeralMap<string, number>(5_000);
			map.set("k", 1);
			// plain JSON.stringify: shape survives, data does not (encodeJson wraps the internal Map as $map and every entry + timestamp round-trips)
			expect(JSON.parse(JSON.stringify(map))).toStrictEqual({ map:{}, msToLive:5_000 });
		});

	});

	describe("expiry lifecycle (EphemeralBase)", () => {

		test(`deleting the last entry clears the timer, so a re-added key keeps a FULL fresh ttl`, async () => {
			const ttl = 300;
			const map = new EphemeralMap<string, number>(ttl);
			map.set("one", 1);
			map.delete("one");

			// re-adding queues a brand-new timer; at ~40% of the ttl it must still be present
			map.set("two", 2);
			await new Promise(res => setTimeout(res, Math.round(ttl * 0.4)));
			expect(map.has("two")).toBe(true);

			// and it expires shortly after its own full ttl
			await vi.waitFor(() => expect(map.has("two")).toBe(false), { timeout: 2_000 });
		});

		test(`entries expire approximately msToLive after being set`, async () => {
			const map = new EphemeralMap<string, number>(150);
			map.set("a", 1);
			expect(map.has("a")).toBe(true);
			await vi.waitFor(() => expect(map.has("a")).toBe(false), { timeout: 2_000 });
			expect(map.size).toBe(0);
		});

	});

});

