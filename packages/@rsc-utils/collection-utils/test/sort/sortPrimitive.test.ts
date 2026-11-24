import { describe, expect, test } from "vitest";
import { sortPrimitive } from "../../build/index.js";

	describe("sort", () => {
		describe("sortPrimitive", () => {
			const getInput = () => [2, 1, null, "2", true, NaN, null, undefined, 2, null, "1", 1, false, true];
			const getDatesInput = () => [283334400001, new Date(283334400000), 283334400000, new Date(283334400001), new Date(283334400000)];
			const getMixedInput = () => [...getInput(), ...getDatesInput()];

			test(`sortPrimitive`, () => {
				const input = getInput();
				const expected = [false, true, true, 1, 1, "1", 2, 2, "2", NaN, null, null, null, undefined];
				expect(input).not.toStrictEqual(expected);
				input.sort(sortPrimitive);
				expect(input).toStrictEqual(expected);
			});

			test(`sortPrimitive() (reversed)`, () => {
				const input = getInput();
				const expected = [undefined, null, null, null, NaN, "2", 2, 2, "1", 1, 1, true, true, false];
				expect(input).not.toStrictEqual(expected);
				input.sort(sortPrimitive).reverse();
				expect(input).toStrictEqual(expected);
			});

			test(`sortPrimitive (dates)`, () => {
				const input = getDatesInput();
				const expected = [new Date(283334400000), new Date(283334400000), 283334400000, new Date(283334400001), 283334400001];
				expect(input).not.toStrictEqual(expected);
				input.sort(sortPrimitive);
				expect(input).toStrictEqual(expected);
			});

			test(`sortPrimitive (reversed dates)`, () => {
				const input = getDatesInput();
				const expected = [283334400001, new Date(283334400001), 283334400000, new Date(283334400000), new Date(283334400000)];
				expect(input).not.toStrictEqual(expected);
				input.sort(sortPrimitive).reverse();
				expect(input).toStrictEqual(expected);
			});

			test(`sortPrimitive (mixed)`, () => {
				const input = getMixedInput();
				const expected = [false, true, true, 1, 1, "1", 2, 2, "2", new Date(283334400000), new Date(283334400000), 283334400000, new Date(283334400001), 283334400001, NaN, null, null, null, undefined];
				expect(input).not.toStrictEqual(expected);
				input.sort(sortPrimitive);
				expect(input).toStrictEqual(expected);
			});

			test(`sortPrimitive (reversed mixed)`, () => {
				const input = getMixedInput();
				const expected = [undefined, null, null, null, NaN, 283334400001, new Date(283334400001), 283334400000, new Date(283334400000), new Date(283334400000), "2", 2, 2, "1", 1, 1, true, true, false];
				expect(input).not.toStrictEqual(expected);
				input.sort(sortPrimitive).reverse();
				expect(input).toStrictEqual(expected);
			});

			test(`sortPrimitive (single value)`, () => {
				const input = [false];
				const expected = [false];
				input.sort(sortPrimitive).reverse();
				expect(input).toStrictEqual(expected);
			});

			test(`sortPrimitive (empty array)`, () => {
				const input: (string | number | boolean | Date | null | undefined)[] = [];
				const expected: typeof input = [];
				input.sort(sortPrimitive).reverse();
				expect(input).toStrictEqual(expected);
			});

			describe("pairwise", () => {

				test(`undefined is the "greatest" value and null is second`, () => {
					expect(sortPrimitive(undefined, null)).toBe(1);
					expect(sortPrimitive(null, undefined)).toBe(-1);
					expect(sortPrimitive(undefined, 1)).toBe(1);
					expect(sortPrimitive(1, undefined)).toBe(-1);
					expect(sortPrimitive(null, 1)).toBe(1);
				});

				test(`strings compare case-insensitively first; equal-lowercase pairs put UPPERCASE before lowercase`, () => {
					expect(sortPrimitive("A", "a")).toBe(-1);
					expect(sortPrimitive("a", "A")).toBe(1);
					expect(sortPrimitive("b", "A")).toBe(1);
				});

				test(`numbers sort before equal-valued strings via type-name ordering ("number" < "string")`, () => {
					// mixed-type pairs need an explicit union T — the signature ties both operands to one Optional<T>
					expect(sortPrimitive<string | number>(2, "2")).toBe(-1);
					expect(sortPrimitive<string | number>("2", 2)).toBe(1);
				});

				test(`booleans: false sorts before true; identical values are always 0`, () => {
					expect(sortPrimitive(false, true)).toBe(-1);
					expect(sortPrimitive(true, false)).toBe(1);
					expect(sortPrimitive(true, true)).toBe(0);
					expect(sortPrimitive("x", "x")).toBe(0);
				});

				test(`0 and -0 are kept apart (Object.is lets them through the identity check) — -0 sorts before 0; identical zeros return 0`, () => {
					expect(Object.is(0, -0)).toBe(false);
					expect(sortPrimitive(0, 0)).toBe(0);
					expect(sortPrimitive(0, -0)).toBe(1);
					expect(sortPrimitive(-0, 0)).toBe(-1);
				});

				test(`two equal Date objects return 0 (distinct objects fail Object.is, so the dedicated Date-vs-Date branch compares timestamps)`, () => {
					const a = new Date(5);
					const b = new Date(5);
					expect(sortPrimitive(a, b)).toBe(0);
					expect(sortPrimitive(b, a)).toBe(0);
				});

				test(`a Date sorts before an equal-timestamp number ("date" < "number") but by value when they differ`, () => {
					expect(sortPrimitive<Date | number>(new Date(5), 5)).toBe(-1);
					expect(sortPrimitive<Date | number>(new Date(4), 5)).toBe(-1);
					expect(sortPrimitive<Date | number>(new Date(6), 5)).toBe(1);
				});

				test(`Invalid Dates are the "fourth greatest" value — distinct invalid pairs tie at 0 (just as NaN === NaN) and they sort after every valid value but before plain NaN`, () => {
					const invalid = new Date(NaN);
					// two DISTINCT Invalid Dates tie at 0 via the both-sides getTime check; same ref short-circuits via Object.is
					expect(sortPrimitive(invalid, new Date("not a date"))).toBe(0);
					expect(sortPrimitive(new Date("also invalid"), invalid)).toBe(0);
					expect(sortPrimitive(invalid, invalid)).toBe(0);
					// after every valid value...
					expect(sortPrimitive<Date | number>(5, invalid)).toBe(-1);
					expect(sortPrimitive<Date | string>("a", invalid)).toBe(-1);
					expect(sortPrimitive<Date | boolean>(true, invalid)).toBe(-1);
					expect(sortPrimitive(new Date(5), invalid)).toBe(-1);
					// ...but before plain NaN (the "third greatest"), null, and undefined
					expect(sortPrimitive<Date | number>(Number.NaN, invalid)).toBe(1);
					expect(sortPrimitive<Date | number>(invalid, Number.NaN)).toBe(-1);
					expect(sortPrimitive(null, invalid)).toBe(1);
					expect(sortPrimitive(undefined, invalid)).toBe(1);
				});

			});
		});
	});