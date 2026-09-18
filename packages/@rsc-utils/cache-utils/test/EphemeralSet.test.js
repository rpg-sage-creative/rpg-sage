import { EphemeralSet } from "../build/index.js";

async function pause(...args) {
	const first = args[0];
	const ms = first.ms ?? args[0];
	const label = first.label ?? args[1] ?? "Unlabeled";
	const data = first.data ?? undefined;
	const log = first.log;
	if (log) silly(`Pausing for ${ms}ms: ${label} ...`); // NOSONAR
	await (new Promise(res => setTimeout(res, ms)));
	if (log) silly(`Pausing for ${ms}ms: ${label} ... done.`); // NOSONAR
	return data;
}

/**
 * This test can be a little finicky because of the nature of timeouts.
 * @todo This test should be rewritten with times that will ensure we aren't failing due to a millisecond here or there.
 */

describe("EphemeralSet", () => {

	const a = { a:"A" };
	const b = { b:"B" };

	const ms = 250;
	const pms = ms / 2 + 5;
	const set = new EphemeralSet(ms);

	test(`The set should be empty ('a' and 'b' NOT present).`, () => {
		expect(set.msToLive).toBe(ms);
		expect(set.size).toBe(0);
		expect(set.has(a)).toBe(false);
		expect(set.has(b)).toBe(false);
	});

	// add first item
	test(`Adding 'a' should show the set has 'a' and NOT 'b'.`, () => {
		set.add(a);
		expect(set.size).toBe(1);
		expect(set.has(a)).toBe(true);
		expect(set.has(b)).toBe(false);
	});

	// add a second item
	test(`Half pause, then adding 'b' should show the set has 'a' AND 'b'.`, async () => {
		await pause(pms);

		set.add(b);
		expect(set.size).toBe(2);
		expect(set.has(a)).toBe(true);
		expect(set.has(b)).toBe(true);
	});

	// verify first is gone
	test(`Half pause, then the set should still have 'b' but NOT 'a'.`, async () => {
		// pause half, making it a full since first item added
		await pause(pms);

		expect(set.size).toBe(1);
		expect(set.has(a)).toBe(false);
		expect(set.has(b)).toBe(true);
	});

	// verify b is still there, even though expired, because the timer hasn't fired
	test(`Half pause, then the set should still have 'b' and NOT 'a'.`, async () => {
		// pause half, making it half since 2nd timer was initiated
		await pause(pms);

		expect(set.size).toBe(1);
		expect(set.has(a)).toBe(false);
		expect(set.has(b)).toBe(true);
	});

	// verify second is gone
	test(`Half pause, then the set should be empty again.`, async () => {
		// pause half, making it two full since first item added
		await pause(pms);

		expect(set.size).toBe(0);
		expect(set.has(a)).toBe(false);
		expect(set.has(b)).toBe(false);
	});

	test(`Half pause, then adding 'a' should show the set has 'a' and NOT 'b' again.`, async () => {
		// pause just to pad time
		await pause(pms);

		set.add(a);
		expect(set.size).toBe(1);
		expect(set.has(a)).toBe(true);
		expect(set.has(b)).toBe(false);
	});

	test(`Half pause, then the set should still have 'a' and NOT 'b'.`, async () => {
		// pause just to pad time
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

});
