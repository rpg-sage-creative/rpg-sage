import { describe, expect, test } from "vitest";
import { sortAsPrimitive } from "../../build/index.js";

	describe("sortAsPrimitive", () => {

		test(`sortAsPrimitive("string")`, () => {
			const input = [ 2,1,null,"2",true,null,undefined,2,null,"1",1,false,true];
			// value ties (2 vs "2", 1 vs "1") are broken by ORIGINAL type — numbers before equal strings ("number" < "string")
			const expected = [ 1,1,"1",2,2,"2",false,true,true,null,null,null,undefined];
			expect(input).not.toStrictEqual(expected);
			input.sort(sortAsPrimitive("string"));
			expect(input).toStrictEqual(expected);
		});

		test(`sortAsPrimitive("number") converts values with Number() before comparing`, () => {
			const input = ["10", 9, "9", 10];
			input.sort(sortAsPrimitive("number"));
			// numeric order: 9/9 sort before 10/10; number vs string of equal value falls back to type ordering
			expect(input.map(Number)).toStrictEqual([9, 9, 10, 10]);
		});

		test(`sortAsPrimitive("date") converts strings and Dates with new Date() before comparing`, () => {
			const input = [new Date(100), "1970-01-01T00:00:00.050Z", new Date(200)];
			input.sort(sortAsPrimitive("date"));
			// the ISO string (50ms) sorts first even though it is not a Date instance; the array keeps the ORIGINAL values (a raw + on the string would be NaN)
			expect(input.map(v => +new Date(v as string | number | Date))).toStrictEqual([50, 100, 200]);
		});

		test(`sortAsPrimitive("string") is case-insensitive-first by default`, () => {
			const input = ["B","a","A","b"];
			input.sort(sortAsPrimitive("string"));
			expect(input).toStrictEqual(["A","a","B","b"]);
		});

		test(`NaN ordering is consistent through sortAsPrimitive("number"): NaN vs NaN is 0 and NaN sorts after every number`, () => {
			const asNumber = sortAsPrimitive("number");
			expect(asNumber(Number.NaN, Number.NaN)).toBe(0);
			expect(asNumber(Number.NaN, 1)).toBe(1);
			expect(asNumber(1, Number.NaN)).toBe(-1);
		});

		test(`Invalid Dates are the "fourth greatest" value through sortAsPrimitive("date") — unparsable conversions tie at 0 and sort after every valid Date`, () => {
			const asDate = sortAsPrimitive("date");
			// two distinct Invalid Dates tie at 0 (the both-sides getTime check in sortPrimitive)
			expect(asDate(new Date(NaN), new Date("not a date"))).toBe(0);
			// valid dates sort before invalid ones
			expect(asDate(new Date(5), new Date("not a date"))).toBe(-1);
			// QUIRK: plain NaN input is CONVERTED to an Invalid Date by the sorter, so it ties at value level with other unparsables (the "third greatest" number tier is unreachable through this sorter — only nullish values pass unconverted); the tie then resolves by ORIGINAL type ("date" < "number")
			expect(asDate(Number.NaN, new Date(NaN))).toBe(1);
			expect(asDate(new Date(NaN), Number.NaN)).toBe(-1);
		});

		test(`value ties resolve by ORIGINAL value types using sortPrimitive's type-name ordering ("boolean" < "date" < "number" < "string")`, () => {
			const asNumber = sortAsPrimitive("number");
			// 9 and "9" both convert to the number 9 — equal as values, broken by original type
			expect(asNumber(9, "9")).toBe(-1);
			expect(asNumber("9", 9)).toBe(1);
			// true converts to 1; boolean sorts before number
			expect(asNumber(true, 1)).toBe(-1);
			// same-type ties stay equal — no case/precision sub-tiebreak: "as X" means value order (raw sortPrimitive("A","a") would case-break)
			expect(asNumber("A", "a")).toBe(0);
			// the nullish ladder still wins before any type tiebreak
			expect(asNumber(null, "abc")).toBe(1);
		});

		test(`sorting as strings vs numbers differs for multi-digit values — "101" sorts before "99" lexicographically, but 99 is correctly less than 101 numerically`, () => {
			// pairwise: string order compares digit-by-digit ("1" < "9"), number order converts first
			expect(sortAsPrimitive("string")("101", "99")).toBe(-1);
			expect(sortAsPrimitive("number")("101", "99")).toBe(1);

			// array-level proof: lexicographic puts 3-digit 101 before single-digit 9; numeric order is the natural one
			const strings = ["99", "101", "9"];
			strings.sort(sortAsPrimitive("string"));
			expect(strings).toStrictEqual(["101", "9", "99"]);

			const numbers = [99, 101, 9];
			numbers.sort(sortAsPrimitive("number"));
			expect(numbers).toStrictEqual([9, 99, 101]);

			// mixed originals: as numbers they interleave by VALUE (no type tiebreak — the values differ)
			const mixed = ["101", 99, "9"];
			mixed.sort(sortAsPrimitive("number"));
			expect(mixed).toStrictEqual(["9", 99, "101"]);
		});

		test(`sortAsPrimitive leaves null/undefined unconverted so they keep their "greatest" positions, with NaN between them and the values`, () => {
			const input = [null, undefined, 3, Number.NaN];
			input.sort(sortAsPrimitive("number"));
			// Number(NaN) stays NaN — it keeps its "third greatest" slot after every value but before null/undefined (contrast sortAsPrimitive("date"), which CONVERTS NaN into an Invalid Date)
			expect(input).toStrictEqual([3, Number.NaN, null, undefined]);
		});
	});
