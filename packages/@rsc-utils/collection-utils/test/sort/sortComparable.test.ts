import { describe, expect, test } from "vitest";
import { sortComparable } from "../../build/index.js";
import type { Comparable, Sorter } from "../../build/index.js";

class Version implements Comparable<Version> {
	constructor(public v:number) {}
	compareTo(other: Version) {
		return this.v < other.v ? -1 : this.v > other.v ? 1 : 0;
	}
}

describe("sortComparable", () => {

	test(`delegates to compareTo for less-than and greater-than`, () => {
		expect(sortComparable(new Version(1), new Version(2))).toBe(-1);
		expect(sortComparable(new Version(2), new Version(1))).toBe(1);
	});

	test(`identical references return 0 without calling compareTo`, () => {
		const a = new Version(1);
		expect(sortComparable(a, a)).toBe(0);

		// even a compareTo that would throw is never reached
		const boom: Comparable<never> = { compareTo() { throw new Error("must not be called"); } };
		expect(sortComparable(boom, boom)).toBe(0);
	});

	test(`equal-but-distinct objects defer to compareTo (which returns 0 here)`, () => {
		expect(sortComparable(new Version(5), new Version(5))).toBe(0);
	});

	test(`undefined is the "greatest" value and null is second — checked BEFORE compareTo`, () => {
		const v = new Version(1);
		expect(sortComparable(undefined, v)).toBe(1);
		expect(sortComparable(v, undefined)).toBe(-1);
		expect(sortComparable(null, v)).toBe(1);
		expect(sortComparable(v, null)).toBe(-1);
	});

	test(`sorts an array of Comparables ascending with nullish values last`, () => {
		const input: (Version | null | undefined)[] = [new Version(3), null, new Version(1), undefined, new Version(2)];
		// sortComparable is directly assignable to Sorter since its parameters accept Optional values
		const sorter: Sorter<Version> = sortComparable;
		input.sort(sorter);
		expect(input.map(v => v instanceof Version ? v.v : v)).toStrictEqual([1, 2, 3, null, undefined]);
	});

});
