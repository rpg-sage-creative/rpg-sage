import { describe, expect, test, vi } from "vitest";
import { EphemeralSet } from "../../build/index.js";

async function pause(ms: number): Promise<void> {
	await new Promise(res => setTimeout(res, ms));
}

// Expiry assertions use vi.waitFor instead of fixed pauses so a slow millisecond here or there cannot fail the suite.
// Presence assertions stay on explicit pauses: cleanup only ever runs from the timer, and each scheduled clean is at least one full ttl away when checked.

describe("EphemeralSet", () => {

	const a = { a:"A" };
	const b = { b:"B" };

	const ms = 200;
	const pms = ms / 2 + 15;
	const set = new EphemeralSet(ms);

	test(`The set should be empty ('a' and 'b' NOT present).`, () => {
		expect(set.msToLive).toBe(ms);
		expect(set.size).toBe(0);
		expect(set.has(a)).toBe(false);
		expect(set.has(b)).toBe(false);
	});

	test(`Adding 'a' should show the set has 'a' and NOT 'b'.`, () => {
		set.add(a);
		expect(set.size).toBe(1);
		expect(set.has(a)).toBe(true);
		expect(set.has(b)).toBe(false);
	});

	test(`Half pause, then adding 'b' should show the set has 'a' AND 'b'.`, async () => {
		await pause(pms);

		set.add(b);
		expect(set.size).toBe(2);
		expect(set.has(a)).toBe(true);
		expect(set.has(b)).toBe(true);
	});

	test(`After the first ttl elapses, 'a' is gone (lazy read or cleanup) while 'b' remains.`, async () => {
		// interval stays small so the follow-up "still present" check happens well before b's own expiry (~315ms)
		await vi.waitFor(() => expect(set.has(a)).toBe(false), { timeout: 2_000, interval: 10 });
		expect(set.size).toBe(1);
		expect(set.has(b)).toBe(true);
	});

	test(`At b's own ttl the set should be empty — cleanup now fires at the earliest live entry's exact expiry (and lazy reads would report it gone anyway).`, async () => {
		await vi.waitFor(() => expect(set.has(b)).toBe(false), { timeout: 2_000 });

		expect(set.size).toBe(0);
		expect(set.has(a)).toBe(false);
		expect(set.has(b)).toBe(false);
	});

	test(`Re-adding 'a' after cleanup should show the set has 'a' and NOT 'b' again.`, async () => {
		set.add(a);
		expect(set.size).toBe(1);
		expect(set.has(a)).toBe(true);
		expect(set.has(b)).toBe(false);

		await pause(pms);

		expect(set.size).toBe(1);
		expect(set.has(a)).toBe(true);
		expect(set.has(b)).toBe(false);
	});

	test(`Clear the set, then the set should be empty again.`, () => {
		set.clear();
		expect(set.size).toBe(0);
		expect(set.has(a)).toBe(false);
		expect(set.has(b)).toBe(false);
	});

	describe("iteration", () => {

		test(`entries/keys/values/[Symbol.iterator] iterate insertion order; entries pairs are [value, value]`, () => {
			const s = new EphemeralSet<string>(60_000);
			s.add("x").add("y");
			expect([...s.entries()]).toStrictEqual([["x", "x"], ["y", "y"]]);
			expect([...s.keys()]).toStrictEqual(["x", "y"]);
			expect([...s.values()]).toStrictEqual(["x", "y"]);
			// spread uses [Symbol.iterator] -> values
			expect([...s]).toStrictEqual(["x", "y"]);
		});

		test(`forEach passes (value, value, set) — Set-style duplicate arguments`, () => {
			const s = new EphemeralSet<string>(60_000);
			s.add("x");
			const seen: [string, string, boolean][] = [];
			s.forEach((value, value2, s2) => seen.push([value, value2, s2 === s]));
			expect(seen).toStrictEqual([["x", "x", true]]);
		});

		test(`values() (the custom Iterator.from implementation) SKIPS values deleted during iteration`, () => {
			const s = new EphemeralSet<string>(60_000);
			s.add("x").add("y").add("z");
			const seen: string[] = [];
			for (const v of s.values()) {
				seen.push(v);
				if (v === "x") s.delete("y");
			}
			expect(seen).toStrictEqual(["x", "z"]);
		});

		test(`add returns this, so it chains; delete reports whether the value was present`, () => {
			const s = new EphemeralSet<string>(60_000);
			expect(s.add("x")).toBe(s);
			expect(s.delete("x")).toBe(true);
			expect(s.delete("x")).toBe(false);
		});

		test(`Symbol.toStringTag renders as "[object EphemeralSet]"`, () => {
			const s = new EphemeralSet<string>(60_000);
			expect(Object.prototype.toString.call(s)).toBe("[object EphemeralSet]");
		});

		test(`toJSON keeps JSON.stringify from throwing on the internal timer — plain stringify still DROPS entries (the Map serializes as {}); use json-utils encodeJson/decodeJson/cloneJson for a lossless round-trip`, () => {
			const s = new EphemeralSet<string>(5_000);
			s.add("x");
			expect(JSON.parse(JSON.stringify(s))).toStrictEqual({ map:{}, msToLive:5_000 });
		});

		test(`lazy expiry: values()/keys()/entries() SKIP expired entries without evicting; has() reports them gone (Date-only fake timers keep the cleanup timer from firing)`, () => {
			vi.useFakeTimers({ toFake:["Date"] });
			try {
				const start = Date.now();
				const s = new EphemeralSet<string>(60_000);
				s.add("x").add("y");

				expect([...s.values()]).toStrictEqual(["x", "y"]);

				vi.setSystemTime(start + 60_001); // expired per the clock; the real cleanup timer (~60s away) has not fired

				expect([...s.values()]).toStrictEqual([]);
				expect([...s.keys()]).toStrictEqual([]);
				expect([...s.entries()]).toStrictEqual([]);
				// iterators are read-only — size holds until cleanup or a lazy has/get eviction
				expect(s.size).toBe(2);

				expect(s.has("x")).toBe(false);
				s.clear(); // drop the pending real timer and the entries
			} finally {
				vi.useRealTimers();
			}
		});

	});

});
