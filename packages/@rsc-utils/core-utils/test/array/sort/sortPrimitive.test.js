import { sortPrimitive } from "../../../build/index.js";
describe("array", () => {
	describe("sort", () => {
		describe("sortPrimitive", () => {
			const getInput = () => [2, 1, null, "2", true, null, undefined, 2, null, "1", 1, false, true];
			const getDatesInput = () => [283334400001, new Date(283334400000), 283334400000, new Date(283334400001), new Date(283334400000)];
			const getMixedInput = () => getInput().concat(getDatesInput());

			test(`sortPrimitive`, () => {
				const input = getInput();
				const expected = [false, true, true, 1, 1, "1", 2, 2, "2", null, null, null, undefined];
				expect(input).not.toStrictEqual(expected);
				input.sort(sortPrimitive);
				expect(input).toStrictEqual(expected);
			});

			test(`sortPrimitive() (reversed)`, () => {
				const input = getInput();
				const expected = [undefined, null, null, null, "2", 2, 2, "1", 1, 1, true, true, false];
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
				const expected = [false, true, true, 1, 1, "1", 2, 2, "2", new Date(283334400000), new Date(283334400000), 283334400000, new Date(283334400001), 283334400001, null, null, null, undefined];
				expect(input).not.toStrictEqual(expected);
				input.sort(sortPrimitive);
				expect(input).toStrictEqual(expected);
			});

			test(`sortPrimitive (reversed mixed)`, () => {
				const input = getMixedInput();
				const expected = [undefined, null, null, null, 283334400001, new Date(283334400001), 283334400000, new Date(283334400000), new Date(283334400000), "2", 2, 2, "1", 1, 1, true, true, false];
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
				const input = [];
				const expected = [];
				input.sort(sortPrimitive).reverse();
				expect(input).toStrictEqual(expected);
			});
		});
	});
});